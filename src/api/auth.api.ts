import { delay } from "./store";
import { requesterApi } from "./requester.api";
import { apiBaseUrl, useMockApi } from "./api.config";
import { ApiError } from "./http.client";

export const authApi = {
  async getCurrentUser() { if (useMockApi) { await delay(200); return null; } try { return await requesterApi.getCurrentUser(); } catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; } },
  startMicrosoftLogin() { window.location.assign(`${apiBaseUrl}/auth/microsoft`); },
  async logout() { if (!useMockApi) return requesterApi.logout(); await delay(150); },
};
