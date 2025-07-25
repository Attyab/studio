
export type Status = 'To Do' | 'In Progress' | 'Done';
export type Priority = 'Low' | 'Medium' | 'High';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate?: Date;
  assigneeId: string;
  due_date: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  members: User[];
}
