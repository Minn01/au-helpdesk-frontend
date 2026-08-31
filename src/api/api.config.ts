export const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true";

export const appBasePath = "/helpdesk";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.PROD ? "/helpdesk/api" : "/api")).replace(/\/$/, "");
