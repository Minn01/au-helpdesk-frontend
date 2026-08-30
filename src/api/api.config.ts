export const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true";

export const appBasePath = "/helpdesk";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.PROD ? "/helpdesk/api" : "/api")).replace(/\/$/, "");

export const developmentUserIds = {
  STUDENT: import.meta.env.VITE_DEV_STUDENT_ID || "10000000-0000-4000-8000-000000000001",
  FACULTY: import.meta.env.VITE_DEV_FACULTY_ID || "10000000-0000-4000-8000-000000000002",
  ADMIN: import.meta.env.VITE_DEV_ADMIN_ID || "10000000-0000-4000-8000-000000000003",
  TECHNICIAN: import.meta.env.VITE_DEV_TECHNICIAN_ID || "10000000-0000-4000-8000-000000000004",
} as const;
