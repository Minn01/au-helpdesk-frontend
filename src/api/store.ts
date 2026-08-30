import { categories as initialCategories, initialComments, initialTickets, users as initialUsers } from "../mocks/data";
import type { Category, Comment, Ticket } from "../types/ticket";
import type { User } from "../types/user";

export let tickets: Ticket[] = structuredClone(initialTickets);
export let comments: Comment[] = structuredClone(initialComments);
export let categories: Category[] = structuredClone(initialCategories);
export let users: User[] = structuredClone([
  ...Object.values(initialUsers),
  { id: "user-tech-2", name: "Jordan Lee", email: "jordan.lee@university.edu", role: "TECHNICIAN", createdAt: "2025-02-14T08:00:00Z", isActive: true } satisfies User,
]);
export const delay = (ms = 350) => new Promise((resolve) => window.setTimeout(resolve, ms));
export const setTickets = (next: Ticket[]) => { tickets = next; };
export const setComments = (next: Comment[]) => { comments = next; };
export const setCategories = (next: Category[]) => { categories = next; };
export const setUsers = (next: User[]) => { users = next; };
