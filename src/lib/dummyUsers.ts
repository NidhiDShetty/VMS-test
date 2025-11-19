// src/lib/dummyUsers.ts

export type UserRole = "SuperAdmin" | "Admin" | "Host" | "Security";

export interface DummyUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const DUMMY_USERS: DummyUser[] = [
  {
    id: "superadmin-1",
    name: "Super Admin",
    email: "superAdmin@ct.com",
    password: "superAdmin@2025",
    role: "SuperAdmin",
  },
  {
    id: "admin-1",
    name: "Admin",
    email: "admin@ct.com",
    password: "admin@2025",
    role: "Admin",
  },
  {
    id: "host-1",
    name: "Host",
    email: "host@ct.com",
    password: "host@2025",
    role: "Host",
  },
  {
    id: "security-1",
    name: "Security",
    email: "security@ct.com",
    password: "security@2025",
    role: "Security",
  },
];
