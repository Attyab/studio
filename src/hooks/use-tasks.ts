
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User, Status } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { DUMMY_USERS } from '@/lib/data';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchUsersAndTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // RLS policies are likely not set for the 'users' table.
    // We are using a dummy list of users for now.
    // To fix, go to your Supabase dashboard, select "Authentication" > "Policies",
    // and create a new policy for the 'users' table to allow logged-in users to read it.
    // For example, a policy with the rule `auth.role() = 'authenticated'`.
    setUsers(DUMMY_USERS);

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


  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            if (data) {
                const user = { ...data, initials: data.name.split(' ').map(n => n[0]).join('') };
                setCurrentUser(user);
                // Ensure the current user is in the local user list
                if (!DUMMY_USERS.some(u => u.id === user.id)) {
                  setUsers(prev => [user, ...prev]);
                }
            }
        }
        await fetchUsersAndTasks();
        setLoading(false);
    };
    checkUser();
  }, [supabase, fetchUsersAndTasks]);

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

  const addTask = async (task: Omit<Task, 'id' | 'due_date' | 'assignee_id'>) => {
    if (!currentUser) throw new Error("User must be logged in to add a task");
    
    const { data, error } = await supabase.from('tasks').insert([
        { 
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.dueDate?.toISOString(),
            assignee_id: task.assigneeId,
            user_id: currentUser.id
        }
    ]).select().single();

    if (error) {
        console.error('Error adding task:', error);
        throw error;
    }

    if (data) {
        const newTask = {...data, dueDate: data.due_date ? new Date(data.due_date) : undefined, assigneeId: data.assignee_id};
        setTasks(prevTasks => [...prevTasks, newTask]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    const { data, error } = await supabase.from('tasks').update({ 
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate?.toISOString(),
        assignee_id: updatedTask.assigneeId
    }).eq('id', updatedTask.id).select().single();

    if (error) {
        console.error('Error updating task:', error);
        throw error;
    }
    
    if(data) {
        const newTask = {...data, dueDate: data.due_date ? new Date(data.due_date) : undefined, assigneeId: data.assignee_id};
        setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? newTask : task));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const changeCurrentUser = useCallback((userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          // This function is now problematic in a real auth scenario.
          // For now, it will just change the view locally without a real login.
          setCurrentUser(user);
      } else {
          console.error("User not found.");
      }
  }, [users]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error('Login failed:', error.message);
        setLoading(false);
        return false;
    }
    if (data.user) {
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (userData) {
          const user = {...userData, initials: userData.name.split(' ').map(n => n[0]).join('')};
          setCurrentUser(user);
          if (!users.some(u => u.id === user.id)) {
            setUsers(prev => [user, ...prev]);
          }
        }
    }
    setLoading(false);
    return !!data.user;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setTasks([]);
    setUsers(DUMMY_USERS); // Reset to dummy users on logout
    setLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) {
        throw new Error('Password is required for signup.');
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
        console.error('Signup failed:', error.message);
        setLoading(false);
        throw error;
    }

    if (data.user) {
         const { error: userInsertError } = await supabase.from('users').insert({
            id: data.user.id,
            name: name,
            email: email,
            avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.charAt(0)}`,
        });

        if (userInsertError) {
             console.error('Error creating user profile:', userInsertError.message);
             setLoading(false);
             throw userInsertError;
        }

        const newUser: User = {
            id: data.user.id,
            name,
            email,
            avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.charAt(0)}`,
            initials: name.split(' ').map(n => n[0]).join('')
        };
        
        setCurrentUser(newUser);
        setUsers(prev => [newUser, ...prev]);
    }
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
