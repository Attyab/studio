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

export const tasks: Task[] = [];
