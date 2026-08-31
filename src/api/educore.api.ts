import type { EduCoreRegistrationContext } from "../types/educore";
import { useMockApi } from "./api.config";
import { ApiError, httpClient } from "./http.client";
import { delay, tickets } from "./store";

const errorMessages: Record<string, string> = {
  EDUCORE_CONTEXT_NOT_AVAILABLE: "No EduCore registration context is associated with this ticket.",
  EDUCORE_CONTEXT_NOT_FOUND: "EduCore could not find registration information for this event.",
  EDUCORE_UNAVAILABLE: "EduCore is currently unavailable. Try again later.",
  EDUCORE_AUTH_FAILED: "The HelpDesk server could not authenticate with EduCore.",
  EDUCORE_INVALID_RESPONSE: "EduCore returned an unexpected response.",
  FORBIDDEN: "You don't have permission to view EduCore registration context for this ticket.",
  TICKET_NOT_FOUND: "This ticket no longer exists.",
};

export const eduCoreErrorMessage = (reason: unknown) => reason instanceof ApiError ? errorMessages[reason.code] ?? reason.message : reason instanceof Error ? reason.message : "Registration context could not be loaded.";
export const isNeutralEduCoreError = (reason: unknown) => reason instanceof ApiError && reason.code === "EDUCORE_CONTEXT_NOT_AVAILABLE";

export const eduCoreApi = {
  async getContext(ticketId: string, signal?: AbortSignal): Promise<EduCoreRegistrationContext> {
    if (useMockApi) {
      await delay(350); const ticket = tickets.find((item) => item.id === ticketId); if (!ticket) throw new ApiError(404, "TICKET_NOT_FOUND", errorMessages.TICKET_NOT_FOUND);
      if (ticket.category.name !== "Course Registration") throw new ApiError(404, "EDUCORE_CONTEXT_NOT_AVAILABLE", errorMessages.EDUCORE_CONTEXT_NOT_AVAILABLE);
      return { studentId: "S123", courseCode: "CS401", registrationStatus: "FAILED", failureReason: "System error while processing registration", attemptedAt: "2026-08-28T03:45:00.000Z", additionalContext: { term: "2026/1", attemptNumber: 2 } };
    }
    const { context } = await httpClient.get<{ context: EduCoreRegistrationContext }>(`/tickets/${ticketId}/educore-context`, signal);
    return context;
  },
};
