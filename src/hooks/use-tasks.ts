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
    setCurrentUser(initialUsers[0] || null);
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
      setCurrentUser(user || null);
  }, [users]);

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
  };
}
