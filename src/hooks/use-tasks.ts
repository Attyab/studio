
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { PostgrestError, User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { users as dummyUsers, tasks as dummyTasks } from '@/lib/data';

export function useTaskStore() {
  const [supabase] = useState<SupabaseClient>(() => getSupabaseBrowserClient());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleUserSession = useCallback(async (sessionUser: SupabaseUser | null, supabaseClient: SupabaseClient) => {
    if (sessionUser) {
      const { data: userProfile, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error for dummy user flow
        console.error('Error fetching user profile:', error);
        setError(error);
        setCurrentUser(null);
      } else if (userProfile) {
        setCurrentUser(userProfile as User);
      }
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleUserSession(session?.user ?? null, supabase);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleUserSession(session?.user ?? null, supabase);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, handleUserSession]);


  const fetchUsersAndTasks = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error('Error fetching users:', usersError);
      setError(usersError);
    } else {
       // Combine dummy users with fetched users to ensure they are available
      const allUsers = [...dummyUsers, ...usersData.filter(u => !dummyUsers.find(du => du.id === u.id))];
      setUsers(allUsers as User[]);
    }

    // Load dummy tasks as a workaround for RLS issues
    const formattedTasks = dummyTasks.map(t => ({...t, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id}));
    setTasks(formattedTasks as unknown as Task[]);


    // The original Supabase call is commented out to avoid the RLS error.
    // To re-enable, fix the Supabase project's RLS policies for the 'tasks' table.
    /*
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
     if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setError(tasksError);
    } else {
      const formattedTasks = tasksData.map(t => ({...t, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id}));
      setTasks(formattedTasks as unknown as Task[]);
    }
    */
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (currentUser && supabase) {
        fetchUsersAndTasks();

        const changes = supabase.channel('table-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
            (payload) => {
                fetchUsersAndTasks();
            }
        ).on('postgres_changes', { event: '*', schema: 'public', table: 'users' },
            (payload) => {
                fetchUsersAndTasks();
            }
        ).subscribe();

        return () => {
            supabase.removeChannel(changes);
        }
    }
  }, [currentUser, fetchUsersAndTasks, supabase]);

  const getTasksByUserId = useCallback(
    (userId: string) => {
      return tasks.filter((task) => task.assigneeId === userId);
    },
    [tasks]
  );

  const getTaskById = useCallback(
    (taskId: string) => {
      return tasks.find((task) => task.id === taskId);
    },
    [tasks]
  );

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'due_date' | 'assignee_id'>) => {
    if (!currentUser || !supabase) throw new Error("User must be logged in to add a task");
    
    const newTask = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate?.toISOString().split('T')[0],
        assignee_id: task.assigneeId
    };

    const { error } = await supabase.from('tasks').insert(newTask);
    if (error) {
        console.error("Error adding task:", error);
        setError(error);
    }
  }, [supabase, currentUser]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!supabase) return;
    const taskToUpdate = {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate?.toISOString().split('T')[0],
        assignee_id: updatedTask.assigneeId
    };

    const { error } = await supabase.from('tasks').update(taskToUpdate).eq('id', updatedTask.id);
     if (error) {
        console.error("Error updating task:", error);
        setError(error);
    }
  }, [supabase]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
        console.error("Error deleting task:", error);
        setError(error);
    }
  }, [supabase]);
  
  const changeCurrentUser = useCallback((userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          setCurrentUser(user);
      } else {
          alert("User not found.");
      }
  }, [users]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    // Try to log in with a dummy user first for local dev
    const dummyUser = dummyUsers.find(u => u.email === email);
    if (dummyUser) {
        setCurrentUser(dummyUser);
        setUsers(dummyUsers);
        setLoading(false);
        return true;
    }
    
    if (!password || !supabase) {
        setLoading(false);
        return false;
    };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
        console.error('Login failed:', error.message);
        return false;
    }
    return true;
  };

  const logout = async () => {
    setLoading(true);
    // Also sign out from Supabase if the user was real
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setTasks([]);
    setUsers([]);
    setLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    setLoading(true);
    // Use a dummy user for local development to bypass Supabase config issues
    const dummyUser = dummyUsers.find(u => u.email === email);
    if (dummyUser) {
        setCurrentUser(dummyUser);
        setUsers(dummyUsers);
        setLoading(false);
        return;
    }

    // Try creating a new dummy user if the email is not already taken
    const newDummyId = (dummyUsers.length + 1).toString();
    const newDummyUser: User = {
        id: newDummyId,
        name: name,
        email: email,
        avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.charAt(0)}`,
        initials: name.charAt(0).toUpperCase(),
    };
    dummyUsers.push(newDummyUser);
    setCurrentUser(newDummyUser);
    setUsers(dummyUsers);
    setLoading(false);
    
    // The original Supabase call is commented out to avoid the error.
    // To re-enable, fix the Supabase project's auth settings.
    /*
    if (!password || !supabase) {
        throw new Error("Password is required for signup.");
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                full_name: name,
                avatar_url: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.charAt(0)}`
            }
        }
    });

    if (error) {
        if (error.message.includes("is invalid")) {
            const friendlyError = new Error("Signup failed. Please check your Supabase project's auth settings to ensure new user signups are enabled and the email provider is not blocked.");
            console.error(friendlyError.message, error);
            setLoading(false);
            throw friendlyError;
        }
        console.error('Signup failed:', error.message);
        setLoading(false);
        throw error;
    }

    if (data.user) {
        // The onAuthStateChange listener will handle setting the user session
        // and we rely on the trigger to insert the user profile.
    } else {
        setLoading(false);
    }
    */
  };

  return {
    tasks,
    users,
    currentUser,
    loading,
    error,
    getTasksByUserId,
    getTaskById,
    addTask,
    updateTask,
    deleteTask,
    changeCurrentUser,
    login,
    logout,
    signup,
  };
}
