import type { Category, Comment, Ticket } from "../types/ticket";
import type { User, UserRole } from "../types/user";

export const users: Record<UserRole, User> = {
  STUDENT: { id: "user-student", name: "Maya Chen", email: "maya.chen@university.edu", role: "STUDENT", createdAt: "2025-08-20T08:00:00Z" },
  FACULTY: { id: "user-faculty", name: "Dr. James Wilson", email: "james.wilson@university.edu", role: "FACULTY", createdAt: "2023-01-10T08:00:00Z" },
  TECHNICIAN: { id: "user-tech", name: "Alex Rivera", email: "alex.rivera@university.edu", role: "TECHNICIAN", createdAt: "2024-03-12T08:00:00Z" },
  ADMIN: { id: "user-admin", name: "Priya Shah", email: "priya.shah@university.edu", role: "ADMIN", createdAt: "2022-04-05T08:00:00Z" },
};

Object.values(users).forEach((user) => { user.isActive = true; });

export const categories: Category[] = [
  ["network", "Network", "Wi-Fi, VPN, and connectivity"], ["hardware", "Hardware", "Computers and physical equipment"],
  ["software", "Software", "Applications and licensing"], ["account", "University Account", "Microsoft and university access"],
  ["registration", "Course Registration", "Registration systems"], ["printer", "Printer", "Printing and scanning"],
  ["classroom", "Classroom Equipment", "Teaching room technology"], ["other", "Other", "Anything else"],
].map(([id, name, description]) => ({ id, name, description }));

const student = users.STUDENT;
const tech = users.TECHNICIAN;
const activity = (id: string, ticketId: string, type: string, description: string, createdAt: string) => ({ id, ticketId, type, description, createdAt });

export const initialTickets: Ticket[] = [
  {
    id: "ticket-1", ticketNumber: "HD-000123", title: "Unable to connect to university Wi-Fi",
    description: "My laptop disconnects from AU-Secure every few minutes. I have already restarted it and forgotten/rejoined the network, but the issue continues.",
    status: "IN_PROGRESS", priority: "MEDIUM", location: "CL Building", category: categories[0], categorySource: "AI_SUGGESTED", createdBy: student, assignedTechnician: tech, attachments: [], aiSuggestedCategory: "Network", aiSuggestedPriority: "MEDIUM", aiSummary: "Student experiences repeated disconnections from university Wi-Fi.",
    createdAt: "2026-08-27T03:30:00Z", updatedAt: "2026-08-27T04:04:00Z",
    activities: [activity("a1", "ticket-1", "CREATED", "Ticket created", "2026-08-27T03:30:00Z"), activity("a2", "ticket-1", "CLASSIFIED", "Classified as Network with medium priority", "2026-08-27T03:31:00Z"), activity("a3", "ticket-1", "ASSIGNED", "Assigned to Alex Rivera", "2026-08-27T03:45:00Z"), activity("a4", "ticket-1", "STATUS_CHANGED", "Status changed from Open to In progress", "2026-08-27T04:04:00Z")],
  },
  {
    id: "ticket-2", ticketNumber: "HD-000124", title: "Computer in Room 402 will not turn on",
    description: "The instructor computer does not respond when the power button is pressed. The monitor and desk power strip both have power.",
    status: "OPEN", priority: "HIGH", location: "CL Building Room 402", category: categories[1], categorySource: "USER_SELECTED", createdBy: student, attachments: [],
    createdAt: "2026-08-28T02:15:00Z", updatedAt: "2026-08-28T02:16:00Z",
    activities: [activity("a5", "ticket-2", "CREATED", "Ticket created", "2026-08-28T02:15:00Z"), activity("a6", "ticket-2", "CLASSIFIED", "Classified as Hardware with high priority", "2026-08-28T02:16:00Z")],
  },
  {
    id: "ticket-3", ticketNumber: "HD-000119", title: "Cannot access Microsoft university account",
    description: "Microsoft says my account is temporarily locked when I try to sign in to Outlook and Teams.",
    status: "RESOLVED", priority: "HIGH", category: categories[3], categorySource: "AI_SUGGESTED", createdBy: student, assignedTechnician: tech, attachments: [], aiSuggestedCategory: "University Account", aiSuggestedPriority: "HIGH",
    createdAt: "2026-08-22T06:20:00Z", updatedAt: "2026-08-23T08:10:00Z",
    activities: [activity("a7", "ticket-3", "CREATED", "Ticket created", "2026-08-22T06:20:00Z"), activity("a8", "ticket-3", "RESOLVED", "Ticket resolved — account access restored", "2026-08-23T08:10:00Z")],
  },
  {
    id: "ticket-4", ticketNumber: "HD-000125", title: "Course registration page shows an error",
    description: "The registration page returns an unexpected error when I add CS401 to my schedule.",
    status: "OPEN", priority: "URGENT", category: categories[4], categorySource: "USER_SELECTED", createdBy: student, attachments: [],
    createdAt: "2026-08-29T01:05:00Z", updatedAt: "2026-08-29T01:06:00Z",
    activities: [activity("a9", "ticket-4", "CREATED", "Ticket created", "2026-08-29T01:05:00Z")],
  },
];

export const initialComments: Comment[] = [
  { id: "c1", ticketId: "ticket-1", author: student, message: "This happens in both the library and CL Building.", createdAt: "2026-08-27T03:36:00Z" },
  { id: "c2", ticketId: "ticket-1", author: tech, message: "Thanks, Maya. I’m checking your device registration and the access points in that area.", createdAt: "2026-08-27T04:06:00Z" },
];
