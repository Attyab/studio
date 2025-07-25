
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User, Status, Priority } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { DUMMY_USERS, DUMMY_TASKS } from '@/lib/data';
import { PostgrestError } from '@supabase/supabase-js';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchUsersAndTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Using dummy data to avoid RLS issues on Supabase
    setUsers(DUMMY_USERS);
    setTasks(DUMMY_TASKS.map(t => ({...t, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id})));
    
    // Set a default current user for the dummy data scenario
    if (DUMMY_USERS.length > 0) {
      setCurrentUser(DUMMY_USERS[0]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsersAndTasks();
  }, [fetchUsersAndTasks]);

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
    
    const newTask: Task = {
      id: (Math.random() * 10000).toString(),
      ...task,
      due_date: task.dueDate?.toISOString() || '',
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const updateTask = async (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const changeCurrentUser = useCallback((userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          setCurrentUser(user);
      } else {
          console.error("User not found.");
      }
  }, [users]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    const user = users.find(u => u.email === email);
    if (user) {
        setCurrentUser(user);
        setLoading(false);
        return true;
    }
    setLoading(false);
    return false;
  };

  const logout = async () => {
    setLoading(true);
    setCurrentUser(null);
    setTasks([]);
    setUsers(DUMMY_USERS); // Reset to dummy users on logout
    if(DUMMY_USERS.length > 0) {
        // To avoid being redirected to login, we'll set a default user.
        // In a real app, you would clear the user and redirect.
        setCurrentUser(DUMMY_USERS[0]);
    }
    setLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    setLoading(true);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        throw new Error('User already exists.');
    }

    const newUser: User = {
        id: (Math.random() * 10000).toString(),
        name,
        email,
        avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.split(' ').map(n=>n[0]).join('')}`,
        initials: name.split(' ').map(n => n[0]).join('')
    };
    
    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
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
