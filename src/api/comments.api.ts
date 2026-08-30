import type { User } from "../types/user";
import { comments, delay, setComments, setTickets, tickets } from "./store";
import { requesterApi } from "./requester.api";
import { useMockApi } from "./api.config";

export const commentsApi = {
  async getComments(ticketId: string, signal?: AbortSignal) { if (!useMockApi) return requesterApi.getComments(ticketId, signal); await delay(280); return structuredClone(comments.filter((comment) => comment.ticketId === ticketId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))); },
  async createComment(ticketId: string, message: string, author: User) {
    if (!useMockApi) return requesterApi.createComment(ticketId, message);
    await delay(420); const createdAt = new Date().toISOString(); const comment = { id: `comment-${Date.now()}`, ticketId, author, message, createdAt };
    setComments([...comments, comment]); setTickets(tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, updatedAt: createdAt, activities: [...ticket.activities, { id: `activity-${Date.now()}`, ticketId, actor: author, type: "COMMENT_ADDED", description: `${author.name} added a comment`, createdAt }] } : ticket));
    return structuredClone(comment);
  },
};
