
import { Task, User } from './types';

// This file is no longer used for dummy data and can be removed or repurposed.
export const users: User[] = [];

export const tasks: Omit<Task, 'id' | 'dueDate'>[] = [];
