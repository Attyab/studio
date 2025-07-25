
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User } from '@/lib/types';
import { users as dummyUsers, tasks as dummyTasks } from '@/lib/data';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    // Initialize with dummy data
    setUsers(dummyUsers);
    setTasks(dummyTasks.map(t => ({...t, dueDate: new Date(t.due_date)})));
    // Set a default user to simulate being logged in
    if (dummyUsers.length > 0) {
      setCurrentUser(dummyUsers[0]);
    }
    setLoading(false);
  }, []);

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

  const addTask = useCallback((task: Omit<Task, 'id' | 'due_date' | 'assignee_id'>) => {
    if (!currentUser) throw new Error("User must be logged in to add a task");
    
    const newTask: Task = {
        ...task,
        id: (Math.random() * 10000).toString(),
        due_date: task.dueDate?.toISOString() || new Date().toISOString(),
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
  }, [currentUser]);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);
  
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
    setLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    setLoading(true);
    let user = users.find(u => u.email === email);
    if (!user) {
        const newUser: User = {
            id: (Math.random() * 10000).toString(),
            name,
            email,
            avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.charAt(0)}`,
            initials: name.charAt(0).toUpperCase(),
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
    } else {
        // If user exists, just log them in
        setCurrentUser(user);
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
