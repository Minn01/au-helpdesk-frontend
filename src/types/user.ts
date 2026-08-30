export type UserRole = "STUDENT" | "FACULTY" | "TECHNICIAN" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isActive?: boolean;
  assignedTicketCount?: number;
}
