import type { User } from "./user";

export type TicketStatus = "OPEN" | "CLAIMED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type CategorySource = "USER_SELECTED" | "AI_SUGGESTED" | "TECHNICIAN_OVERRIDE";

export interface Category { id: string; name: string; description?: string; isActive?: boolean }
export interface Attachment { id: string; ticketId: string; fileName: string; fileType: string; sizeBytes: number; uploadedAt: string; uploadedBy?: User; fileUrl?: string }
export interface Assignment { id: string; ticketId: string; technician: User; assignedAt: string; claimedAt?: string }
export interface Comment { id: string; ticketId: string; author: User; message: string; createdAt: string; updatedAt?: string }
export interface TicketActivity { id: string; ticketId: string; actor?: User; type: string; description: string; createdAt: string }

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  location?: string;
  category: Category;
  categorySource: CategorySource;
  createdBy: User;
  assignedTechnician?: User;
  attachments: Attachment[];
  activities: TicketActivity[];
  createdAt: string;
  updatedAt: string;
  aiSuggestedCategory?: string;
  aiSuggestedPriority?: TicketPriority;
  aiSummary?: string;
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus | "ALL";
  priority?: TicketPriority | "ALL";
  categoryId?: string | "ALL";
  sort?: "newest" | "oldest";
  assignedTechnicianId?: string | "ALL";
  page?: number;
  pageSize?: number;
}

export interface TicketInput {
  title: string;
  description: string;
  categoryId: string | "AUTO_DETECT";
  location?: string;
  files?: File[];
}
