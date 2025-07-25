
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { PostgrestError, AuthError, User as SupabaseUser } from '@supabase/supabase-js';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | AuthError | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchUsers = useCallback(async () => {
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error('Error fetching users:', usersError);
      setError(usersError);
      setUsers([]);
    } else {
      setUsers(usersData.map(u => ({...u, initials: u.name.split(' ').map((n:string) => n[0]).join('') })));
    }
  }, [supabase]);

  const fetchTasks = useCallback(async () => {
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
     if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setError(tasksError);
    } else {
      const formattedTasks = tasksData.map(t => ({...t, id: t.id, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id, due_date: t.due_date}));
      setTasks(formattedTasks);
    }
  }, [supabase]);

  const handleUserSession = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (sessionUser) {
        let { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', sessionUser.id).single();
        
        if (profileError || !profile) {
            console.error("Could not fetch user profile from DB.", profileError);
            
            // If the profile doesn't exist, create it. This can happen if a user was created before the trigger was in place.
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                id: sessionUser.id,
                email: sessionUser.email!,
                // Attempt to get name from metadata, otherwise fallback to email
                name: sessionUser.user_metadata?.full_name || sessionUser.email!.split('@')[0],
                avatar: sessionUser.user_metadata?.avatar_url || `https://placehold.co/128x128.png`
              })
              .select()
              .single();

            if (insertError) {
              console.error("Failed to create missing user profile.", insertError);
              setCurrentUser(null);
            } else {
              profile = newProfile;
            }
        }
        
        if (profile) {
            const user: User = {...profile, initials: profile.name.split(' ').map((n: string) => n[0]).join('')};
            setCurrentUser(user);
            await fetchTasks();
            await fetchUsers();
        }

    } else {
        setCurrentUser(null);
        setTasks([]);
        setUsers([]);
    }
    setLoading(false);
  }, [supabase, fetchTasks, fetchUsers]);


  useEffect(() => {
    setLoading(true);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await handleUserSession(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleUserSession(session?.user ?? null);
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
    
    // Create a new object for insertion, ensuring we don't send extra fields
    const { title, description, status, priority, assigneeId, dueDate } = task;
    const taskToInsert = {
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId,
      due_date: dueDate ? dueDate.toISOString() : null,
    };

    const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();

    if (error) {
        console.error('Error adding task:', error);
        setError(error);
        return;
    }

    if (data) {
        const newTask: Task = {
          ...data, 
          dueDate: data.due_date ? new Date(data.due_date) : undefined, 
          assigneeId: data.assignee_id, 
          due_date: data.due_date
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
     // Create a new object for update, ensuring we don't send extra fields
    const { id, title, description, status, priority, assigneeId, dueDate } = updatedTask;
    const taskToUpdate = {
      id,
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId,
      due_date: dueDate ? dueDate.toISOString() : null,
    };

    const { data, error } = await supabase
        .from('tasks')
        .update(taskToUpdate)
        .eq('id', updatedTask.id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating task:', error);
        setError(error);
        return;
    }
    
    if (data) {
        const newTask: Task = {
            ...data, 
            dueDate: data.due_date ? new Date(data.due_date) : undefined, 
            assigneeId: data.assignee_id,
            due_date: data.due_date
        };
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
      const userToSwitchTo = users.find(u => u.id === userId);
      if (userToSwitchTo) {
        setCurrentUser(userToSwitchTo);
      } else {
           const { data: realUser, error } = await supabase.from('users').select('*').eq('id', userId).single();
            if (realUser) {
                setCurrentUser({...realUser, initials: realUser.name.split(' ').map((n:string) => n[0]).join('')});
            } else {
                console.error("Could not switch to user in DB.", error);
            }
      }
  }, [supabase, users]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
    if (error) {
      console.error('Login failed:', error.message);
      setError(error);
      setLoading(false);
      return false;
    }
    // Session change will be handled by onAuthStateChange
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // Session change will be handled by onAuthStateChange
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) {
        throw new Error("Password is required for signup.");
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
        console.error('Signup failed:', error);
        setLoading(false);
        throw error;
    }
    
    // onAuthStateChange will handle setting the current user and fetching data
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
