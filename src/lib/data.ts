
import { Task, User } from './types';

export const DUMMY_USERS: User[] = [
    {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: 'https://placehold.co/32x32/E9C46A/264653.png?text=AJ',
        initials: 'AJ',
    },
    {
        id: '2',
        name: 'Bob Williams',
        email: 'bob@example.com',
        avatar: 'https://placehold.co/32x32/F4A261/264653.png?text=BW',
        initials: 'BW',
    },
    {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        avatar: 'https://placehold.co/32x32/E76F51/FFFFFF.png?text=CB',
        initials: 'CB',
    },
];

export const DUMMY_TASKS: Omit<Task, 'id'>[] = [
  {
    title: 'Design the new landing page',
    description: 'Create a mockup in Figma for the new marketing landing page.',
    status: 'In Progress',
    priority: 'High',
    assigneeId: '1',
    assignee_id: '1',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  },
  {
    title: 'Develop the authentication flow',
    description: 'Implement email/password login using Supabase Auth.',
    status: 'To Do',
    priority: 'High',
    assigneeId: '2',
    assignee_id: '2',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Set up the database schema',
    description: 'Define and create the tables for tasks and users in Supabase.',
    status: 'Done',
    priority: 'Medium',
    assigneeId: '2',
    assignee_id: '2',
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    title: 'Write API documentation',
    description: 'Document the endpoints for the task management API.',
    status: 'To Do',
    priority: 'Low',
    assigneeId: '3',
    assignee_id: '3',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
    {
    title: 'Test the application on mobile devices',
    description: 'Ensure the app is responsive and functional on iOS and Android.',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: '1',
    assignee_id: '1',
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
