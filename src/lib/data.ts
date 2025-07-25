import { Task, User } from './types';

export const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', avatar: 'https://placehold.co/32x32/E9C46A/264653.png', initials: 'A' },
  { id: '2', name: 'Bob', email: 'bob@example.com', avatar: 'https://placehold.co/32x32/F4A261/264653.png', initials: 'B' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', avatar: 'https://placehold.co/32x32/E76F51/FFFFFF.png', initials: 'C' },
  { id: '4', name: 'Diana', email: 'diana@example.com', avatar: 'https://placehold.co/32x32/2A9D8F/FFFFFF.png', initials: 'D' },
];

export const tasks: Task[] = [
  {
    id: 'TASK-1',
    title: 'Design the new homepage',
    description: 'Create a new design for the homepage that is more user-friendly.',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    assigneeId: '1',
  },
  {
    id: 'TASK-2',
    title: 'Develop the authentication feature',
    description: 'Implement user authentication using NextAuth.js.',
    status: 'To Do',
    priority: 'High',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    assigneeId: '2',
  },
  {
    id: 'TASK-3',
    title: 'Write documentation for the API',
    description: 'Document all endpoints of the new API.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    assigneeId: '3',
  },
  {
    id: 'TASK-4',
    title: 'Fix bug in the payment gateway',
    description: 'Users are reporting issues with the payment gateway.',
    status: 'Done',
    priority: 'High',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    assigneeId: '4',
  },
  {
    id: 'TASK-5',
    title: 'Deploy the new version to production',
    description: 'Deploy the latest version of the app to the production server.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    assigneeId: '1',
  },
  {
    id: 'TASK-6',
    title: 'Update the user profile page UI',
    description: 'The user profile page needs a design refresh.',
    status: 'In Progress',
    priority: 'Low',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    assigneeId: '3',
  },
  {
    id: 'TASK-7',
    title: 'Conduct user testing for the new feature',
    description: 'Gather feedback from users on the new feature.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 12)),
    assigneeId: '2',
  },
];
