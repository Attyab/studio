
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User, Status, Priority } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { PostgrestError, AuthError, User as SupabaseUser } from '@supabase/supabase-js';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | AuthError | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchUsersAndTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error('Error fetching users:', usersError);
      setError(usersError);
      // If we can't fetch users, we can't proceed with most of the app's functionality.
      // But we can at least try to load tasks.
      setUsers([]);
    } else {
      setUsers(usersData.map(u => ({...u, initials: u.name.split(' ').map(n => n[0]).join('') })));
    }

    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
     if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setError(tasksError);
    } else {
      const formattedTasks = tasksData.map(t => ({...t, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id}));
      setTasks(formattedTasks);
    }

    setLoading(false);
  }, [supabase]);


  const handleUserSession = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (sessionUser) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', sessionUser.id).single();

        if (profile) {
            setCurrentUser({...profile, initials: profile.name.split(' ').map((n: string) => n[0]).join('')});
            await fetchUsersAndTasks();
        } else {
            // Fallback if profile doesn't exist yet or fails to load
            const name = sessionUser.user_metadata?.full_name || sessionUser.email || 'New User';
            const initials = name.split(' ').map((n: string) => n[0]).join('');
            setCurrentUser({
                id: sessionUser.id,
                name,
                email: sessionUser.email!,
                avatar: sessionUser.user_metadata?.avatar_url || '',
                initials
            });
            await fetchUsersAndTasks();
        }
    } else {
        setCurrentUser(null);
        setTasks([]);
        setUsers([]);
    }
    setLoading(false);
  }, [supabase, fetchUsersAndTasks]);


  useEffect(() => {
    setLoading(true);
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
  }, [supabase, handleUserSession]);

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
      // This function simulates switching user context locally
      // For a real app, you would handle this via auth state changes.
      if (user) {
          setCurrentUser(user);
      } else {
          console.error("User not found.");
      }
  }, [users]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
    if (error) {
      console.error('Login failed:', error.message);
      setError(error);
      setLoading(false);
      return false;
    }
    // onAuthStateChange will handle setting the user
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setTasks([]);
    setUsers([]);
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
        // Insert into public.users table
        const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            name: name,
            email: email,
            avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.split(' ').map(n=>n[0]).join('')}`
        });

        if (insertError) {
            console.error('Error creating user profile:', insertError.message || insertError);
            setError(insertError);
            // Even if profile creation fails, the user is signed in.
            // The onAuthStateChange listener will pick up the new user session and handle it.
            // This provides a better user experience than throwing an error here.
        }
    }
    
    // onAuthStateChange will handle setting the user and loading data.
    // No need to call setLoading(false) here, as the user session handler will do it.
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

    