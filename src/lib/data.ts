import { Task, User } from './types';

// Pre-defined dummy users to bypass Supabase email validation issues during local development.
export const users: User[] = [
    {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: 'https://placehold.co/32x32/E9C46A/264653.png?text=A',
        initials: 'AJ'
    },
    {
        id: '2',
        name: 'Bob Williams',
        email: 'bob@example.com',
        avatar: 'https://placehold.co/32x32/2A9D8F/FFFFFF.png?text=B',
        initials: 'BW'
    },
    {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        avatar: 'https://placehold.co/32x32/F4A261/FFFFFF.png?text=C',
        initials: 'CB'
    }
];

export const tasks: Omit<Task, 'id' | 'dueDate'>[] = [
    {
        title: 'Design the new dashboard layout',
        description: 'Create mockups and prototypes for the new dashboard design, focusing on user experience.',
        status: 'In Progress',
        priority: 'High',
        assigneeId: '1',
        due_date: '2024-08-15',
    },
    {
        title: 'Develop the authentication flow',
        description: 'Implement login, signup, and logout functionality. Ensure password recovery is included.',
        status: 'To Do',
        priority: 'High',
        assigneeId: '2',
        due_date: '2024-08-20',
    },
    {
        title: 'Set up the task management API',
        description: 'Create API endpoints for creating, reading, updating, and deleting tasks. Include filtering and sorting.',
        status: 'To Do',
        priority: 'Medium',
        assigneeId: '3',
        due_date: '2024-08-25',
    },
    {
        title: 'Write documentation for the API',
        description: 'Document all the API endpoints, request/response formats, and authentication requirements.',
        status: 'Done',
        priority: 'Low',
        assigneeId: '1',
        due_date: '2024-08-10',
    },
    {
        title: 'Deploy staging environment',
        description: 'Set up a staging server and deploy the current version of the application for testing.',
        status: 'To Do',
        priority: 'Medium',
        assigneeId: '2',
        due_date: '2024-08-18',
    },
    {
        title: 'Test cross-browser compatibility',
        description: 'Ensure the application works as expected on Chrome, Firefox, and Safari.',
        status: 'In Progress',
        priority: 'Medium',
        assigneeId: '3',
        due_date: '2024-08-22',
    }
].map((task, index) => ({...task, id: (index + 1).toString(), dueDate: new Date(task.due_date) }));
