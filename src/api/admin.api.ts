import type { Category, Ticket, TicketFilters, TicketPriority, TicketStatus } from "../types/ticket";
import type { User, UserRole } from "../types/user";
import { adaptCategory, adaptComment, adaptTicket, adaptUser, type ApiCategory, type ApiTicket, type ApiUser } from "./api.adapters";
import { httpClient } from "./http.client";

export interface Pagination { page: number; pageSize: number; total: number; totalPages: number }
export interface AdminTicketPage { tickets: Ticket[]; pagination: Pagination }
export interface AdminDashboard {
  totalTickets: number;
  unassignedOpen: number;
  activeTechnicians: number;
  ticketsByStatus: Partial<Record<TicketStatus, number>>;
  ticketsByPriority: Partial<Record<TicketPriority, number>>;
  technicianWorkload: { technicianId: string; displayName: string; isActive: boolean; activeTickets: number }[];
  recentTickets: { id: string; ticketNumber: string; title: string; status: TicketStatus; priority: TicketPriority; createdAt: string; creator: { id: string; displayName: string }; assignedTechnician: { id: string; displayName: string } | null }[];
}
export interface AdminUserFilters { search?: string; role?: UserRole | "ALL"; active?: boolean | "ALL" }

const ticketQuery = (filters: TicketFilters) => {
  const query = new URLSearchParams();
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
  if (filters.priority && filters.priority !== "ALL") query.set("priority", filters.priority);
  if (filters.categoryId && filters.categoryId !== "ALL") query.set("category", filters.categoryId);
  if (filters.assignedTechnicianId && filters.assignedTechnicianId !== "ALL") query.set("assignedTechnicianId", filters.assignedTechnicianId);
  query.set("sort", filters.sort ?? "newest");
  query.set("page", String(filters.page ?? 1));
  query.set("pageSize", String(filters.pageSize ?? 20));
  return `?${query.toString()}`;
};

const userQuery = (filters: AdminUserFilters) => {
  const query = new URLSearchParams();
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.role && filters.role !== "ALL") query.set("role", filters.role);
  if (filters.active !== undefined && filters.active !== "ALL") query.set("active", String(filters.active));
  const value = query.toString();
  return value ? `?${value}` : "";
};

export const adminApi = {
  getDashboard: (signal?: AbortSignal) => httpClient.get<AdminDashboard>("/admin/dashboard", signal),
  async getTickets(filters: TicketFilters = {}, signal?: AbortSignal): Promise<AdminTicketPage> {
    const result = await httpClient.get<{ tickets: ApiTicket[]; pagination: Pagination }>(`/admin/tickets${ticketQuery(filters)}`, signal);
    return { tickets: result.tickets.map((ticket) => adaptTicket(ticket)), pagination: result.pagination };
  },
  async getTicket(ticketId: string, signal?: AbortSignal) {
    const { ticket } = await httpClient.get<{ ticket: ApiTicket }>(`/admin/tickets/${ticketId}`, signal);
    return { ticket: adaptTicket(ticket), comments: (ticket.comments ?? []).map(adaptComment) };
  },
  async assignTicket(ticketId: string, technicianId: string) {
    const { ticket } = await httpClient.post<{ ticket: ApiTicket }>(`/admin/tickets/${ticketId}/assign`, { technicianId });
    return adaptTicket(ticket);
  },
  async getCategories(signal?: AbortSignal): Promise<Category[]> {
    const { categories } = await httpClient.get<{ categories: ApiCategory[] }>("/admin/categories", signal);
    return categories.map(adaptCategory);
  },
  async createCategory(input: { name: string; description?: string }) {
    const { category } = await httpClient.post<{ category: ApiCategory }>("/admin/categories", { name: input.name.trim(), description: input.description?.trim() || null });
    return adaptCategory(category);
  },
  async updateCategory(categoryId: string, input: { name: string; description?: string }) {
    const { category } = await httpClient.patch<{ category: ApiCategory }>(`/admin/categories/${categoryId}`, { name: input.name.trim(), description: input.description?.trim() || null });
    return adaptCategory(category);
  },
  async setCategoryActive(categoryId: string, isActive: boolean) {
    const { category } = await httpClient.post<{ category: ApiCategory }>(`/admin/categories/${categoryId}/${isActive ? "enable" : "disable"}`);
    return adaptCategory(category);
  },
  async getUsers(filters: AdminUserFilters = {}, signal?: AbortSignal): Promise<User[]> {
    const { users } = await httpClient.get<{ users: ApiUser[] }>(`/admin/users${userQuery(filters)}`, signal);
    return users.map(adaptUser);
  },
  async updateUser(userId: string, input: { role?: UserRole; isActive?: boolean }) {
    const { user } = await httpClient.patch<{ user: ApiUser }>(`/admin/users/${userId}`, input);
    return adaptUser(user);
  },
};
