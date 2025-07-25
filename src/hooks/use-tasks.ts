
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User, Status, Priority } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { PostgrestError, AuthError, User as SupabaseUser } from '@supabase/supabase-js';

// Temporary local user data to work around Supabase RLS issues
const localUsers: User[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=AJ`, initials: 'AJ' },
    { id: '2', name: 'Bob Williams', email: 'bob@example.com', avatar: `https://placehold.co/32x32/F4A261/264653.png?text=BW`, initials: 'BW' },
    { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: `https://placehold.co/32x32/2A9D8F/FFFFFF.png?text=CB`, initials: 'CB' },
];


export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>(localUsers); // Use local data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | AuthError | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchUsers = useCallback(async () => {
    // This fetch is likely blocked by RLS policies. We are using local data as a fallback.
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error('Error fetching users (using local fallback):', usersError);
      setUsers(localUsers);
    } else if (usersData && usersData.length > 0) {
      // If data is successfully fetched, use it instead of local data.
      setUsers(usersData.map(u => ({...u, initials: u.name.split(' ').map((n:string) => n[0]).join('') })));
    } else {
      // If no data is returned (likely RLS), stick with the local data.
      setUsers(localUsers);
    }
  }, [supabase]);

  const fetchTasks = useCallback(async () => {
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
     if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setError(tasksError);
    } else {
      const formattedTasks = tasksData.map(t => ({...t, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id}));
      setTasks(formattedTasks);
    }
  }, [supabase]);

  const handleUserSession = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (sessionUser) {
        const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', sessionUser.id).single();

        if (profile) {
            setCurrentUser({...profile, initials: profile.name.split(' ').map((n: string) => n[0]).join('')});
        } else {
            // This fallback is critical when RLS blocks fetching the user's own profile.
            console.error("Could not fetch user profile from DB, using fallback data.", profileError);
            const localUser = localUsers.find(u => u.email === sessionUser.email)
            const name = localUser?.name || sessionUser.user_metadata?.full_name || sessionUser.email || 'New User';
            const initials = name.split(' ').map((n: string) => n[0]).join('');
            const fallbackUser = {
                id: sessionUser.id,
                name,
                email: sessionUser.email!,
                avatar: localUser?.avatar || sessionUser.user_metadata?.avatar_url || '',
                initials
            };
            setCurrentUser(fallbackUser);
        }
        await fetchTasks();
    } else {
        setCurrentUser(null);
        setTasks([]);
    }
    setLoading(false);
  }, [supabase, fetchTasks]);


  useEffect(() => {
    setLoading(true);
    // Fetch users on initial load to populate dropdowns
    fetchUsers();

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await handleUserSession(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            handleUserSession(session?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
            handleUserSession(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [supabase, handleUserSession, fetchUsers]);

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

  const addTask = async (task: Omit<Task, 'id'| 'assignee_id' | 'due_date'>) => {
    if (!currentUser) throw new Error("User must be logged in to add a task");
    
    const { data, error } = await supabase.from('tasks').insert([{ 
        ...task,
        assignee_id: task.assigneeId,
        due_date: task.dueDate?.toISOString() 
    }]).select().single();

    if (error) {
        console.error('Error adding task:', error);
        setError(error);
        return;
    }

    if (data) {
        const newTask: Task = {...data, dueDate: data.due_date ? new Date(data.due_date) : undefined, assigneeId: data.assignee_id};
        setTasks(prevTasks => [...prevTasks, newTask]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    const { data, error } = await supabase
        .from('tasks')
        .update({ 
            ...updatedTask, 
            assignee_id: updatedTask.assigneeId, 
            due_date: updatedTask.dueDate?.toISOString()
        })
        .eq('id', updatedTask.id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating task:', error);
        setError(error);
        return;
    }
    
    if (data) {
        const newTask: Task = {...data, dueDate: data.due_date ? new Date(data.due_date) : undefined, assigneeId: data.assignee_id};
        setTasks(prevTasks => prevTasks.map(task => task.id === newTask.id ? newTask : task));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        setError(error);
    } else {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };
  
  const changeCurrentUser = useCallback(async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          // This will only work for local users if RLS is blocking reads.
          // For a full multi-user experience, RLS policies must be fixed.
          const realUser = await supabase.from('users').select('*').eq('id', userId).single();
          if (realUser.data) {
              setCurrentUser({...realUser.data, initials: realUser.data.name.split(' ').map((n:string) => n[0]).join('')});
          } else {
               console.error("Could not switch to user in DB, using local data.");
               setCurrentUser(user);
          }
      } else {
          console.error("User not found.");
      }
  }, [users, supabase]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
    if (error) {
      console.error('Login failed:', error.message);
      setError(error);
      setLoading(false);
      return false;
    }
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setTasks([]);
    setLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) {
        throw new Error("Password is required for signup.");
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                full_name: name,
                avatar_url: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.split(' ').map(n=>n[0]).join('')}`
            }
        }
    });

    if (error) {
        console.error('Signup failed:', error.message);
        setLoading(false);
        throw error;
    }

    if (data.user) {
        const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            name: name,
            email: email,
            avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.split(' ').map(n=>n[0]).join('')}`
        });

        if (insertError) {
            console.error('Error creating user profile:', insertError.message);
            setError(insertError);
        } else {
          // Manually add the new user to the local state to update the UI immediately
          const newUser = {
              id: data.user.id,
              name,
              email,
              avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.split(' ').map(n=>n[0]).join('')}`,
              initials: name.split(' ').map(n=>n[0]).join(''),
          };
          setUsers(prev => [...prev, newUser]);
        }
    }
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

    