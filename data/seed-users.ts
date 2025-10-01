export interface SeedUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export const seedUsers: SeedUser[] = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    username: 'alice_j',
    email: 'alice.johnson+clerk_test@example.com',
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    username: 'bob_smith',
    email: 'bob.smith+clerk_test@example.com',
  },
  {
    firstName: 'Carol',
    lastName: 'Davis',
    username: 'carol_d',
    email: 'carol.davis+clerk_test@example.com',
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    username: 'david_w',
    email: 'david.wilson+clerk_test@example.com',
  },
  {
    firstName: 'Emma',
    lastName: 'Brown',
    username: 'emma_b',
    email: 'emma.brown+clerk_test@example.com',
  },
  {
    firstName: 'Frank',
    lastName: 'Miller',
    username: 'frank_m',
    email: 'frank.miller+clerk_test@example.com',
  },
];
