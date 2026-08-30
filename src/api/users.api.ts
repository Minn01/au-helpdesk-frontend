import type { UserRole } from "../types/user";
import { delay, setUsers, users } from "./store";
import { useMockApi } from "./api.config";
import { adminApi, type AdminUserFilters } from "./admin.api";

export const usersApi = {
  async getUsers(filters: AdminUserFilters = {}, signal?: AbortSignal) { if (!useMockApi) return adminApi.getUsers(filters, signal); await delay(); return structuredClone(users.filter((user) => (!filters.search || `${user.name} ${user.email}`.toLowerCase().includes(filters.search.toLowerCase())) && (!filters.role || filters.role === "ALL" || user.role === filters.role) && (filters.active === undefined || filters.active === "ALL" || (user.isActive !== false) === filters.active))); },
  async getTechnicians(signal?: AbortSignal) { if (!useMockApi) return adminApi.getUsers({ role: "TECHNICIAN", active: true }, signal); await delay(); return structuredClone(users.filter((user) => user.role === "TECHNICIAN" && user.isActive !== false)); },
  async updateUser(id: string, input: { role?: UserRole; isActive?: boolean }) { if (!useMockApi) return adminApi.updateUser(id, input); await delay(); const current = users.find((user) => user.id === id); if (!current) throw new Error("User not found."); const updated = { ...current, ...input }; setUsers(users.map((user) => user.id === id ? updated : user)); return structuredClone(updated); },
};
