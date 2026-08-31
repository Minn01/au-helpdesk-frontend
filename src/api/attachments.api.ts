import type { Attachment } from "../types/ticket";
import type { User } from "../types/user";
import { adaptAttachment, type ApiAttachment } from "./api.adapters";
import { useMockApi } from "./api.config";
import { ApiError, httpClient } from "./http.client";
import { delay, setTickets, tickets } from "./store";

export const MAX_ATTACHMENT_FILES = 5;
export const MAX_ATTACHMENT_BYTES = 13 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"] as const;

const messages: Record<string, string> = {
  FILE_TOO_LARGE: "This file exceeds the 13 MB attachment limit.",
  UNSUPPORTED_FILE_TYPE: "This file type is not supported.",
  TOO_MANY_FILES: "You can upload up to 5 files at once.",
  ATTACHMENT_REQUIRED: "Choose at least one file to upload.",
  ATTACHMENT_NOT_FOUND: "This attachment no longer exists.",
  TICKET_NOT_FOUND: "This ticket no longer exists.",
  ATTACHMENT_ACCESS_DENIED: "You don't have permission to access this attachment.",
  ATTACHMENT_UPLOAD_FAILED: "The attachment could not be uploaded. Please try again.",
  ATTACHMENT_RETRIEVAL_FAILED: "The attachment could not be retrieved. Please try again.",
  ATTACHMENT_DELETE_FAILED: "The attachment could not be removed. Please try again.",
};

export const attachmentErrorMessage = (reason: unknown) => reason instanceof ApiError ? messages[reason.code] ?? reason.message : reason instanceof Error ? reason.message : "The attachment request could not be completed.";

export const validateAttachmentFiles = (files: File[]) => {
  if (files.length > MAX_ATTACHMENT_FILES) return messages.TOO_MANY_FILES;
  if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) return messages.FILE_TOO_LARGE;
  if (files.some((file) => !ALLOWED_ATTACHMENT_TYPES.includes(file.type as typeof ALLOWED_ATTACHMENT_TYPES[number]))) return messages.UNSUPPORTED_FILE_TYPE;
  return "";
};

const mockUpload = async (ticketId: string, files: File[], actor?: User) => {
  await delay(); const ticket = tickets.find((item) => item.id === ticketId); if (!ticket) throw new Error("Ticket not found.");
  const uploaded = files.map<Attachment>((file, index) => ({ id: `${ticketId}-attachment-${Date.now()}-${index}`, ticketId, fileName: file.name, fileType: file.type, sizeBytes: file.size, uploadedAt: new Date().toISOString(), uploadedBy: actor, fileUrl: URL.createObjectURL(file) }));
  setTickets(tickets.map((item) => item.id === ticketId ? { ...item, attachments: [...item.attachments, ...uploaded] } : item)); return structuredClone(uploaded);
};

export const attachmentsApi = {
  async uploadAttachments(ticketId: string, files: File[], signal?: AbortSignal, actor?: User) {
    if (useMockApi) return mockUpload(ticketId, files, actor);
    const formData = new FormData(); files.forEach((file) => formData.append("files", file));
    const { attachments } = await httpClient.post<{ attachments: ApiAttachment[] }>(`/tickets/${ticketId}/attachments`, formData, signal);
    return attachments.map((attachment) => adaptAttachment(attachment, ticketId));
  },
  async getAttachmentUrl(ticketId: string, attachmentId: string, signal?: AbortSignal) {
    if (useMockApi) { await delay(100); const attachment = tickets.find((item) => item.id === ticketId)?.attachments.find((item) => item.id === attachmentId); if (!attachment?.fileUrl) throw new Error("Attachment preview is unavailable."); return { url: attachment.fileUrl, expiresAt: new Date(Date.now() + 600_000).toISOString() }; }
    return httpClient.get<{ url: string; expiresAt: string }>(`/tickets/${ticketId}/attachments/${attachmentId}/url`, signal);
  },
  async deleteAttachment(ticketId: string, attachmentId: string) {
    if (useMockApi) { await delay(); setTickets(tickets.map((item) => item.id === ticketId ? { ...item, attachments: item.attachments.filter((attachment) => attachment.id !== attachmentId) } : item)); return; }
    await httpClient.delete<void>(`/tickets/${ticketId}/attachments/${attachmentId}`);
  },
};
