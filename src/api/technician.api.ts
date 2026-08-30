import type { TicketFilters, TicketPriority, TicketStatus } from "../types/ticket";
import { adaptTicket, type ApiTicket } from "./api.adapters";
import { httpClient } from "./http.client";

const queryString = (filters: TicketFilters) => {
  const query = new URLSearchParams();
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
  if (filters.priority && filters.priority !== "ALL") query.set("priority", filters.priority);
  if (filters.categoryId && filters.categoryId !== "ALL") query.set("category", filters.categoryId);
  if (filters.sort) query.set("sort", filters.sort);
  query.set("pageSize", "100");
  const value = query.toString();
  return value ? `?${value}` : "";
};

const ticketResponse = (path: string, body?: unknown) =>
  httpClient.post<{ ticket: ApiTicket }>(path, body).then(({ ticket }) => adaptTicket(ticket));

export const technicianApi = {
  async getQueue(filters: TicketFilters = {}, signal?: AbortSignal) {
    const { tickets } = await httpClient.get<{ tickets: ApiTicket[] }>(
      `/tickets/queue${queryString({ ...filters, status: "ALL" })}`,
      signal,
    );
    return tickets.map((ticket) => adaptTicket(ticket));
  },

  async getAssigned(filters: TicketFilters = {}, signal?: AbortSignal) {
    const { tickets } = await httpClient.get<{ tickets: ApiTicket[] }>(
      `/tickets/assigned${queryString(filters)}`,
      signal,
    );
    return tickets.map((ticket) => adaptTicket(ticket));
  },

  claim(ticketId: string) {
    return ticketResponse(`/tickets/${ticketId}/claim`);
  },

  changeStatus(ticketId: string, status: TicketStatus) {
    if (status === "IN_PROGRESS") return ticketResponse(`/tickets/${ticketId}/start`);
    if (status === "RESOLVED") return ticketResponse(`/tickets/${ticketId}/resolve`);
    throw new Error("That technician status transition is not supported.");
  },

  async changeClassification(
    ticketId: string,
    input: { categoryId?: string; priority?: TicketPriority },
  ) {
    const { ticket } = await httpClient.patch<{ ticket: ApiTicket }>(
      `/tickets/${ticketId}/classification`,
      input,
    );
    return adaptTicket(ticket);
  },
};
