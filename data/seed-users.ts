export interface SeedUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export const seedUsers: SeedUser[] = [
  {
    firstName: "Test",
    lastName: "User1",
    username: "testuser1",
    email: "testuser1+clerk_test@example.com",
  },
  {
    firstName: "Test",
    lastName: "User2",
    username: "testuser2",
    email: "testuser2+clerk_test@example.com",
  },
  {
    firstName: "Test",
    lastName: "User3",
    username: "testuser3",
    email: "testuser3+clerk_test@example.com",
  },
  {
    firstName: "Test",
    lastName: "User4",
    username: "testuser4",
    email: "testuser4+clerk_test@example.com",
  },
];
