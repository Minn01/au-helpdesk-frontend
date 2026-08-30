import { apiBaseUrl } from "./api.config";

type ErrorPayload = { error?: string; message?: string; details?: unknown };
export const unauthorizedEvent = "helpdesk:unauthorized";
export class ApiError extends Error {
  readonly status: number; readonly code: string; readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) { super(message); this.name = "ApiError"; this.status = status; this.code = code; this.details = details; }
}

type RequestOptions = Omit<RequestInit, "body" | "credentials"> & { body?: unknown };
const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, credentials: "include", body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach HelpDesk. Check your connection and try again.");
  }
  if (response.ok) return response.status === 204 ? undefined as T : await response.json() as T;
  let payload: ErrorPayload = {};
  try { payload = await response.json() as ErrorPayload; } catch { /* Non-JSON proxy/server error. */ }
  if (response.status === 401) window.dispatchEvent(new Event(unauthorizedEvent));
  throw new ApiError(response.status, payload.error ?? `HTTP_${response.status}`, response.status === 403 ? "Access denied. Your account does not have permission to view this admin resource." : payload.message ?? "The request could not be completed.", payload.details);
};

export const httpClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: "POST", body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: "PATCH", body, signal }),
};
