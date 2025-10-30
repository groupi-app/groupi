export interface SeedUser {
  name: string;
  username: string;
  email: string;
  role?: 'admin' | 'user';
}

export const seedUsers: SeedUser[] = [
  {
    name: 'Admin User',
    username: 'admin',
    email: 'admin+test@example.com',
    role: 'admin', // Admin user
  },
  {
    name: 'Alice Johnson',
    username: 'alice_j',
    email: 'alice.johnson+test@example.com',
  },
  {
    name: 'Bob Smith',
    username: 'bob_smith',
    email: 'bob.smith+test@example.com',
  },
  {
    name: 'Carol Davis',
    username: 'carol_d',
    email: 'carol.davis+test@example.com',
  },
  {
    name: 'David Wilson',
    username: 'david_w',
    email: 'david.wilson+test@example.com',
  },
  {
    name: 'Emma Brown',
    username: 'emma_b',
    email: 'emma.brown+test@example.com',
  },
  {
    name: 'Frank Miller',
    username: 'frank_m',
    email: 'frank.miller+test@example.com',
  },
];
