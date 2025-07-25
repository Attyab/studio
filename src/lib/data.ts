
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

export const tasks: Omit<Task, 'id' | 'dueDate'>[] = [];
