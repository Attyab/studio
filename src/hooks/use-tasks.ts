
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

      if (error && error.code !== 'PGRST116') { 
        console.error('Error fetching user profile:', error);
        setError(error);
        setCurrentUser(null);
      } else if (userProfile) {
        setCurrentUser(userProfile as User);
      } else {
        // Fallback for user not in public.users table yet
        const { data: newUser, error: newError } = await supabaseClient.from('users').insert({id: sessionUser.id, name: sessionUser.email, email: sessionUser.email, avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${sessionUser.email?.charAt(0)}`, initials: sessionUser.email?.charAt(0).toUpperCase() }).select().single();
        if(newError) {
           console.error('Error creating user profile:', newError);
           setError(newError);
        } else {
            setCurrentUser(newUser as User);
        }
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
      setUsers(usersData as User[]);
    }

    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
     if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setError(tasksError);
    } else {
      const formattedTasks = tasksData.map(t => ({...t, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id}));
      setTasks(formattedTasks as unknown as Task[]);
    }
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
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setTasks([]);
    setUsers([]);
    setLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
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
    
    // The onAuthStateChange listener will handle setting the user session.
    // We manually set loading to false here after a successful call.
    setLoading(false);
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
