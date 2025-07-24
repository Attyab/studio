"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useTaskStore } from '@/hooks/use-tasks';

type TaskStoreContextType = ReturnType<typeof useTaskStore>;

const TaskStoreContext = createContext<TaskStoreContextType | null>(null);

export function useTasks() {
    const context = useContext(TaskStoreContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskStoreProvider');
    }
    return context;
}

export function TaskStoreProvider({ children }: { children: ReactNode }) {
    const taskStore = useTaskStore();
    return (
        <TaskStoreContext.Provider value={taskStore}>
            {children}
        </TaskStoreContext.Provider>
    );
}
