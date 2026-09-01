import type { Ticket, TicketFilters, TicketInput, TicketPriority, TicketStatus } from "../types/ticket";
import type { User } from "../types/user";
import { categories, comments, delay, setTickets, tickets } from "./store";
import { requesterApi } from "./requester.api";
import { useMockApi } from "./api.config";
import { technicianApi } from "./technician.api";
import { adminApi } from "./admin.api";

const normalize = (value: string) => value.toLowerCase().trim();
const mockClassify = (input: TicketInput) => {
  const text = normalize(`${input.title} ${input.description}`);
  const rules = [["wifi", "network"], ["network", "network"], ["computer", "hardware"], ["printer", "printer"], ["microsoft", "account"], ["account", "account"], ["registration", "registration"], ["classroom", "classroom"], ["software", "software"]];
  const categoryId = rules.find(([keyword]) => text.includes(keyword))?.[1] ?? "other";
  return categories.find((item) => item.id === categoryId) ?? categories[categories.length - 1];
};
const mockPriority = (input: TicketInput): TicketPriority => {
  const text = normalize(`${input.title} ${input.description}`);
  if (["system unavailable", "registration failure", "classroom outage", "security breach"].some((word) => text.includes(word))) return "URGENT";
  if (["cannot", "can't", "will not", "locked", "outage", "failure"].some((word) => text.includes(word))) return "HIGH";
  if (["minor", "occasionally", "non-blocking"].some((word) => text.includes(word))) return "LOW";
  return "MEDIUM";
};
const filterTickets = (source: Ticket[], filters: TicketFilters = {}) => {
  let result = [...source];
  if (filters.search) result = result.filter((ticket) => normalize(`${ticket.ticketNumber} ${ticket.title} ${ticket.createdBy.name}`).includes(normalize(filters.search!)));
  if (filters.status && filters.status !== "ALL") result = result.filter((ticket) => ticket.status === filters.status);
  if (filters.priority && filters.priority !== "ALL") result = result.filter((ticket) => ticket.priority === filters.priority);
  if (filters.categoryId && filters.categoryId !== "ALL") result = result.filter((ticket) => ticket.category.id === filters.categoryId);
  if (filters.assignedTechnicianId && filters.assignedTechnicianId !== "ALL") result = result.filter((ticket) => ticket.assignedTechnician?.id === filters.assignedTechnicianId);
  return result.sort((a, b) => filters.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
};
const changeTicket = (id: string, actor: User, changes: Partial<Ticket>, description: string, type: string) => {
  const current = tickets.find((ticket) => ticket.id === id); if (!current) throw new Error("Ticket not found.");
  const now = new Date().toISOString(); const updated: Ticket = { ...current, ...changes, updatedAt: now, activities: [...current.activities, { id: `activity-${Date.now()}`, ticketId: id, actor, type, description, createdAt: now }] };
  setTickets(tickets.map((ticket) => ticket.id === id ? updated : ticket)); return structuredClone(updated);
};
const mockTicketsApi = {
  async getMyTickets(userId: string, filters: TicketFilters = {}) {
    await delay();
    return structuredClone(filterTickets(tickets.filter((ticket) => ticket.createdBy.id === userId), filters));
  },
  async getAllTickets(filters: TicketFilters = {}) { await delay(); return structuredClone(filterTickets(tickets, filters)); },
  async getTicketQueue(filters: TicketFilters = {}) { await delay(); return structuredClone(filterTickets(tickets.filter((ticket) => ticket.status === "OPEN" && !ticket.assignedTechnician), filters)); },
  async getAssignedTickets(technicianId: string, filters: TicketFilters = {}) { await delay(); return structuredClone(filterTickets(tickets.filter((ticket) => ticket.assignedTechnician?.id === technicianId), filters)); },
  async getTicketById(id: string) { await delay(); return structuredClone(tickets.find((ticket) => ticket.id === id) ?? null); },
  async getTicketDetails(id: string) { await delay(); const ticket = tickets.find((item) => item.id === id) ?? null; return { ticket: structuredClone(ticket), comments: structuredClone(comments.filter((comment) => comment.ticketId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) }; },
  async createTicket(input: TicketInput, user: User) {
    await delay(650);
    const now = new Date().toISOString(); const id = `ticket-${Date.now()}`;
    const autoDetect = input.categoryId === "AUTO_DETECT";
    const category = autoDetect ? mockClassify(input) : (categories.find((item) => item.id === input.categoryId) ?? categories[categories.length - 1]); const priority = mockPriority(input);
    const ticket = { id, ticketNumber: `HD-${String(126 + tickets.length).padStart(6, "0")}`, title: input.title, description: input.description, status: "OPEN" as const, priority, location: input.location || undefined, category, categorySource: autoDetect ? "AI_SUGGESTED" as const : "USER_SELECTED" as const, aiSuggestedCategory: autoDetect ? category.name : undefined, aiSuggestedPriority: priority, aiSummary: input.description.slice(0, 140), createdBy: user, attachments: (input.files ?? []).map((file, index) => ({ id: `${id}-file-${index}`, ticketId: id, fileName: file.name, fileUrl: URL.createObjectURL(file), fileType: file.type || "application/octet-stream", sizeBytes: file.size, uploadedBy: user, uploadedAt: now })), createdAt: now, updatedAt: now, activities: [{ id: `${id}-created`, ticketId: id, actor: user, type: "CREATED", description: "Ticket created", createdAt: now }, { id: `${id}-classified`, ticketId: id, type: "CLASSIFIED", description: `Mock AI suggested ${category.name} with ${priority.toLowerCase()} priority`, createdAt: now }] };
    setTickets([ticket, ...tickets]); return structuredClone(ticket);
  },
  async updateTicket(id: string, input: TicketInput, userId: string) {
    await delay(550); const current = tickets.find((ticket) => ticket.id === id);
    if (!current) throw new Error("Ticket not found");
    if (current.createdBy.id !== userId || current.status !== "OPEN") throw new Error("This ticket can no longer be edited.");
    const now = new Date().toISOString(); const autoDetect = input.categoryId === "AUTO_DETECT"; const category = autoDetect ? mockClassify(input) : (categories.find((item) => item.id === input.categoryId) ?? current.category);
    const updated = { ...current, title: input.title, description: input.description, category, categorySource: autoDetect ? "AI_SUGGESTED" as const : "USER_SELECTED" as const, aiSuggestedCategory: autoDetect ? category.name : current.aiSuggestedCategory, location: input.location || undefined, updatedAt: now, activities: [...current.activities, { id: `${id}-updated-${Date.now()}`, ticketId: id, actor: current.createdBy, type: "UPDATED", description: autoDetect ? `Ticket updated; AI suggested ${category.name}` : "Ticket details updated", createdAt: now }] };
    setTickets(tickets.map((ticket) => ticket.id === id ? updated : ticket)); return structuredClone(updated);
  },
  async cancelTicket(id: string, userId: string) {
    await delay(450); const current = tickets.find((ticket) => ticket.id === id);
    if (!current) throw new Error("Ticket not found");
    if (current.createdBy.id !== userId || current.status !== "OPEN") throw new Error("This ticket can no longer be cancelled.");
    const now = new Date().toISOString(); const updated = { ...current, status: "CANCELLED" as const, updatedAt: now, activities: [...current.activities, { id: `${id}-cancelled`, ticketId: id, actor: current.createdBy, type: "CANCELLED", description: "Ticket cancelled", createdAt: now }] };
    setTickets(tickets.map((ticket) => ticket.id === id ? updated : ticket)); return structuredClone(updated);
  },
  async claimTicket(id: string, technician: User) { await delay(); const current = tickets.find((ticket) => ticket.id === id); if (!current) throw new Error("Ticket not found."); if (current.status !== "OPEN" || current.assignedTechnician) throw new Error("This ticket has already been claimed or assigned."); return changeTicket(id, technician, { status: "CLAIMED", assignedTechnician: technician }, `${technician.name} claimed the ticket`, "CLAIMED"); },
  async changeTicketStatus(id: string, status: TicketStatus, actor: User) { await delay(); const current = tickets.find((ticket) => ticket.id === id); if (!current) throw new Error("Ticket not found."); const valid = (current.status === "CLAIMED" && status === "IN_PROGRESS") || (current.status === "IN_PROGRESS" && status === "RESOLVED"); if (!valid) throw new Error("That status transition is not allowed."); if (actor.role === "TECHNICIAN" && current.assignedTechnician?.id !== actor.id) throw new Error("Only the assigned technician can update this ticket."); return changeTicket(id, actor, { status }, `Status changed from ${current.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}`, "STATUS_CHANGED"); },
  async changeTicketPriority(id: string, priority: TicketPriority, actor: User) { await delay(); const current = tickets.find((ticket) => ticket.id === id); if (!current) throw new Error("Ticket not found."); if (!["TECHNICIAN", "ADMIN"].includes(actor.role)) throw new Error("You cannot change ticket priority."); if (actor.role === "TECHNICIAN" && (current.assignedTechnician?.id !== actor.id || !["CLAIMED", "IN_PROGRESS"].includes(current.status))) throw new Error("Only the assigned technician can update an active ticket."); return changeTicket(id, actor, { priority }, `Priority changed from ${current.priority} to ${priority}`, "PRIORITY_CHANGED"); },
  async changeTicketCategory(id: string, categoryId: string, actor: User) { await delay(); const current = tickets.find((ticket) => ticket.id === id); const category = categories.find((item) => item.id === categoryId); if (!current || !category) throw new Error("Ticket or category not found."); if (!["TECHNICIAN", "ADMIN"].includes(actor.role)) throw new Error("You cannot change ticket category."); if (actor.role === "TECHNICIAN" && (current.assignedTechnician?.id !== actor.id || !["CLAIMED", "IN_PROGRESS"].includes(current.status))) throw new Error("Only the assigned technician can update an active ticket."); return changeTicket(id, actor, { category, categorySource: "TECHNICIAN_OVERRIDE" }, `Category changed from ${current.category.name} to ${category.name}`, "CATEGORY_CHANGED"); },
  async assignTicket(id: string, technician: User, actor: User) { await delay(); const current = tickets.find((ticket) => ticket.id === id); if (!current) throw new Error("Ticket not found."); if (actor.role !== "ADMIN") throw new Error("Only an administrator can assign tickets."); if (technician.role !== "TECHNICIAN" || technician.isActive === false) throw new Error("Tickets can only be assigned to an active technician."); if (["RESOLVED", "CLOSED", "CANCELLED"].includes(current.status)) throw new Error("Completed tickets cannot be assigned."); const verb = current.assignedTechnician ? "reassigned" : "assigned"; return changeTicket(id, actor, { assignedTechnician: technician, status: current.status === "OPEN" ? "CLAIMED" : current.status }, `Ticket ${verb} to ${technician.name}`, verb === "assigned" ? "ASSIGNED" : "REASSIGNED"); },
};

export const ticketsApi = useMockApi ? mockTicketsApi : {
  getMyTickets: requesterApi.getMyTickets,
  getTicketById: requesterApi.getTicketById,
  getTicketDetails: requesterApi.getTicketDetails,
  createTicket: (...args: [TicketInput, User]) => requesterApi.createTicket(args[0]),
  updateTicket: (...args: [string, TicketInput, string]) => requesterApi.updateTicket(args[0], args[1]),
  cancelTicket: (...args: [string, string]) => requesterApi.cancelTicket(args[0]),
  getAllTickets: (filters: TicketFilters = {}) => adminApi.getTickets({ ...filters, pageSize: 100 }).then((result) => result.tickets),
  getTicketQueue: technicianApi.getQueue,
  getAssignedTickets: (...args: [string, TicketFilters]) => technicianApi.getAssigned(args[1]),
  claimTicket: (...args: [string, User]) => technicianApi.claim(args[0]),
  changeTicketStatus: (...args: [string, TicketStatus, User]) => technicianApi.changeStatus(args[0], args[1]),
  changeTicketPriority: (...args: [string, TicketPriority, User]) => technicianApi.changeClassification(args[0], { priority: args[1] }),
  changeTicketCategory: (...args: [string, string, User]) => technicianApi.changeClassification(args[0], { categoryId: args[1] }),
  assignTicket: (...args: [string, User, User]) => adminApi.assignTicket(args[0], args[1].id),
};
