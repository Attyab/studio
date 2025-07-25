"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User } from '@/lib/types';
import { tasks as initialTasks, users as initialUsers } from '@/lib/data';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Give each task a default due date if it doesn't have one.
    const tasksWithDefaults = initialTasks.map(task => ({
      ...task,
      dueDate: task.dueDate ?? new Date(),
    }));
    setTasks(tasksWithDefaults);
    setUsers(initialUsers);
    
    // Check for a logged-in user in localStorage
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        const foundUser = initialUsers.find(u => u.id === loggedInUser);
        setCurrentUser(foundUser || null);
    }
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

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    setTasks((prevTasks) => [
      ...prevTasks,
      { ...task, id: `TASK-${Date.now()}`, dueDate: task.dueDate ?? new Date() },
    ]);
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  }, []);
  
  const changeCurrentUser = useCallback((userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', user.id);
      }
  }, [users]);

  const login = useCallback((email: string, password?: string): boolean => {
    // NOTE: In a real app, you'd validate the password. Here we're just finding the user by email.
    const user = users.find(u => u.email === email);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', user.id);
        return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const signup = useCallback((name: string, email: string, password?: string) => {
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        avatar: `https://placehold.co/32x32/E9C46A/264653.png?text=${name.charAt(0)}`,
        initials: name.charAt(0).toUpperCase()
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', newUser.id);
  }, []);

  return {
    tasks,
    users,
    currentUser,
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
