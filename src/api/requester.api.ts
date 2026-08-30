import type { TicketFilters, TicketInput } from "../types/ticket";
import type { UserRole } from "../types/user";
import { adaptCategory, adaptComment, adaptTicket, adaptUser, type ApiTicket } from "./api.adapters";
import { developmentUserIds } from "./api.config";
import { httpClient } from "./http.client";

const ticketBody = (input: TicketInput) => ({ title: input.title.trim(), description: input.description.trim(), location: input.location?.trim() || null, ...(input.categoryId === "AUTO_DETECT" ? { categoryIntent: "AUTO_DETECT" } : { categoryId: input.categoryId }) });
const queryString = (filters: TicketFilters) => { const query = new URLSearchParams(); if (filters.search?.trim()) query.set("search", filters.search.trim()); if (filters.status && filters.status !== "ALL") query.set("status", filters.status); if (filters.priority && filters.priority !== "ALL") query.set("priority", filters.priority); if (filters.categoryId && filters.categoryId !== "ALL") query.set("category", filters.categoryId); if (filters.sort) query.set("sort", filters.sort); query.set("pageSize", "100"); const value = query.toString(); return value ? `?${value}` : ""; };

export const requesterApi = {
  async getCurrentUser(signal?: AbortSignal) { const { user } = await httpClient.get<{ user: Parameters<typeof adaptUser>[0] }>("/auth/me", signal); return adaptUser(user); },
  async developmentLogin(role: UserRole) { const { user } = await httpClient.post<{ user: Parameters<typeof adaptUser>[0] }>("/dev/auth/login", { userId: developmentUserIds[role] }); return adaptUser(user); },
  async logout() { await httpClient.post<void>("/auth/logout"); },
  async getMyTickets(ownerId: string, filters: TicketFilters = {}, signal?: AbortSignal) { const payload = await httpClient.get<{ tickets: ApiTicket[] }>(`/tickets/mine${queryString(filters)}`, signal); return payload.tickets.map((ticket) => adaptTicket(ticket, { id: ownerId, name: "You", email: "", role: "STUDENT", createdAt: ticket.createdAt })); },
  async getTicketById(id: string, signal?: AbortSignal) { const { ticket } = await httpClient.get<{ ticket: ApiTicket }>(`/tickets/${id}`, signal); return adaptTicket(ticket); },
  async createTicket(input: TicketInput) { const { ticket } = await httpClient.post<{ ticket: ApiTicket }>("/tickets", ticketBody(input)); return adaptTicket(ticket); },
  async updateTicket(id: string, input: TicketInput) { const { ticket } = await httpClient.patch<{ ticket: ApiTicket }>(`/tickets/${id}`, ticketBody(input)); return adaptTicket(ticket); },
  async cancelTicket(id: string) { const { ticket } = await httpClient.post<{ ticket: ApiTicket }>(`/tickets/${id}/cancel`); return adaptTicket(ticket); },
  async getCategories(signal?: AbortSignal) { const { categories } = await httpClient.get<{ categories: Parameters<typeof adaptCategory>[0][] }>("/categories", signal); return categories.map(adaptCategory); },
  async getComments(ticketId: string, signal?: AbortSignal) { const { comments } = await httpClient.get<{ comments: Parameters<typeof adaptComment>[0][] }>(`/tickets/${ticketId}/comments`, signal); return comments.map(adaptComment); },
  async createComment(ticketId: string, message: string) { const { comment } = await httpClient.post<{ comment: Parameters<typeof adaptComment>[0] }>(`/tickets/${ticketId}/comments`, { body: message }); return adaptComment(comment); },
};
