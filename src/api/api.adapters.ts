import type { Attachment, Category, Comment, Ticket, TicketActivity } from "../types/ticket";
import type { User, UserRole } from "../types/user";

export type ApiUser = { id: string; email?: string; displayName: string; role: UserRole; isActive?: boolean; createdAt?: string; _count?: { assignedTickets?: number } };
export type ApiCategory = { id: string; name: string; description: string | null; isActive?: boolean };
export type ApiComment = { id: string; ticketId: string; body: string; createdAt: string; updatedAt?: string; author: ApiUser };
type ApiActivity = { id: string; ticketId: string; type: string; message: string; createdAt: string; actor?: ApiUser | null };
type ApiAttachment = { id: string; ticketId: string; fileName: string; storagePath?: string; mimeType: string; createdAt: string };
export type ApiTicket = Omit<Ticket, "category" | "createdBy" | "assignedTechnician" | "attachments" | "activities" | "aiSuggestedCategory"> & { category: ApiCategory; creator?: ApiUser; assignedTechnician?: ApiUser | null; attachments?: ApiAttachment[]; activities?: ApiActivity[]; comments?: ApiComment[]; aiSuggestedCategory?: ApiCategory | null };

export const adaptUser = (user: ApiUser): User => ({ id: user.id, name: user.displayName, email: user.email ?? "", role: user.role, isActive: user.isActive, createdAt: user.createdAt ?? new Date(0).toISOString(), assignedTicketCount: user._count?.assignedTickets });
export const adaptCategory = (category: ApiCategory): Category => ({ id: category.id, name: category.name, description: category.description ?? undefined, isActive: category.isActive });
export const adaptComment = (comment: ApiComment): Comment => ({ id: comment.id, ticketId: comment.ticketId, author: adaptUser(comment.author), message: comment.body, createdAt: comment.createdAt, updatedAt: comment.updatedAt });
export const adaptActivity = (activity: ApiActivity): TicketActivity => ({ id: activity.id, ticketId: activity.ticketId, actor: activity.actor ? adaptUser(activity.actor) : undefined, type: activity.type, description: activity.message, createdAt: activity.createdAt });
const adaptAttachment = (attachment: ApiAttachment): Attachment => ({ id: attachment.id, ticketId: attachment.ticketId, fileName: attachment.fileName, fileUrl: "", fileType: attachment.mimeType, uploadedAt: attachment.createdAt });
export const adaptTicket = (ticket: ApiTicket, fallbackOwner?: User): Ticket => ({ ...ticket, category: adaptCategory(ticket.category), createdBy: ticket.creator ? adaptUser(ticket.creator) : fallbackOwner ?? { id: "current-user", name: "You", email: "", role: "STUDENT", createdAt: ticket.createdAt }, assignedTechnician: ticket.assignedTechnician ? adaptUser(ticket.assignedTechnician) : undefined, attachments: (ticket.attachments ?? []).map(adaptAttachment), activities: (ticket.activities ?? []).map(adaptActivity), aiSuggestedCategory: ticket.aiSuggestedCategory?.name });
