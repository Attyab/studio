import { Task, User } from './types';

// Pre-defined dummy users to bypass Supabase email validation issues during local development.
export const users: User[] = [
    {
        id: '1',
        name: 'User One',
        email: 'user1@example.com',
        avatar: 'https://placehold.co/32x32/E9C46A/264653.png?text=U1',
        initials: 'U1'
    },
    {
        id: '2',
        name: 'User Two',
        email: 'user2@example.com',
        avatar: 'https://placehold.co/32x32/2A9D8F/FFFFFF.png?text=U2',
        initials: 'U2'
    }
];

export const tasks: Omit<Task, 'id' | 'dueDate'>[] = [
    {
        title: 'Design the new dashboard layout',
        description: 'Create mockups and prototypes for the new dashboard design.',
        status: 'In Progress',
        priority: 'High',
        assigneeId: '1',
        due_date: '2024-08-15',
    },
    {
        title: 'Develop the authentication flow',
        description: 'Implement login, signup, and logout functionality using Supabase.',
        status: 'To Do',
        priority: 'High',
        assigneeId: '2',
        due_date: '2024-08-20',
    },
    {
        title: 'Set up the task management API',
        description: 'Create API endpoints for creating, reading, updating, and deleting tasks.',
        status: 'To Do',
        priority: 'Medium',
        assigneeId: '1',
        due_date: '2024-08-25',
    },
    {
        title: 'Write documentation for the API',
        description: 'Document all the API endpoints, request/response formats, and authentication requirements.',
        status: 'Done',
        priority: 'Low',
        assigneeId: '2',
        due_date: '2024-08-10',
    }
].map((task, index) => ({...task, id: (index + 1).toString(), dueDate: new Date(task.due_date) }));
