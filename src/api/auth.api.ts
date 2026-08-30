import { users } from "../mocks/data";
import type { User, UserRole } from "../types/user";
import { delay } from "./store";
import { requesterApi } from "./requester.api";
import { useMockApi } from "./api.config";
import { ApiError } from "./http.client";

let currentUser: User | null = null;
export const authApi = {
  async getCurrentUser() { if (useMockApi) { await delay(200); return currentUser; } try { return await requesterApi.getCurrentUser(); } catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; } },
  startMicrosoftLogin() { window.location.assign("/helpdesk/api/auth/microsoft"); },
  async developmentLogin(role: UserRole) { if (!useMockApi) return requesterApi.developmentLogin(role); await delay(450); currentUser = users[role]; return currentUser; },
  async logout() { if (!useMockApi) return requesterApi.logout(); await delay(150); currentUser = null; },
};
