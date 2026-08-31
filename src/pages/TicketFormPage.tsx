import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { attachmentsApi, attachmentErrorMessage, validateAttachmentFiles } from "../api/attachments.api";
import { categoriesApi } from "../api/categories.api";
import { ticketsApi } from "../api/tickets.api";
import { useAuth } from "../contexts/AuthContext";
import type { Category, Ticket, TicketInput } from "../types/ticket";
import { Icon } from "../components/ui/Icon";
import { ErrorState, LoadingState } from "../components/ui/States";

const formatFileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function TicketFormPage({ edit = false }: { edit?: boolean }) {
  const { ticketId } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]); const [ticket, setTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketInput>({ title: "", description: "", categoryId: "AUTO_DETECT", location: "", files: [] });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [stage, setStage] = useState<"idle" | "creating" | "uploading" | "complete">("idle"); const [error, setError] = useState("");
  useEffect(() => { Promise.all([categoriesApi.getCategories(), edit && ticketId ? ticketsApi.getTicketById(ticketId) : Promise.resolve(null)]).then(([items, existing]) => { setCategories(items); setTicket(existing); if (existing) setForm({ title: existing.title, description: existing.description, categoryId: existing.categorySource === "AI_SUGGESTED" ? "AUTO_DETECT" : existing.category.id, location: existing.location ?? "", files: [] }); }).catch(() => setError("The ticket form could not be loaded.")).finally(() => setLoading(false)); }, [edit, ticketId]);
  const set = (key: keyof TicketInput, value: string | File[]) => setForm((current) => ({ ...current, [key]: value }));
  const chooseFiles = (event: ChangeEvent<HTMLInputElement>) => { const selected = [...(form.files ?? []), ...Array.from(event.target.files ?? [])]; const validation = validateAttachmentFiles(selected); event.target.value = ""; if (validation) { setError(validation); return; } setError(""); set("files", selected); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!user || !form.title.trim() || !form.description.trim() || saving) return;
    const files = form.files ?? []; const validation = validateAttachmentFiles(files); if (validation) { setError(validation); return; }
    setSaving(true); setError(""); setStage(edit ? "creating" : "creating"); let result: Ticket;
    try { result = edit && ticketId ? await ticketsApi.updateTicket(ticketId, { ...form, files: [] }, user.id) : await ticketsApi.createTicket({ ...form, files: [] }, user); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Your ticket could not be saved."); setSaving(false); setStage("idle"); return; }
    if (files.length > 0) {
      setStage("uploading");
      try { await attachmentsApi.uploadAttachments(result.id, files, undefined, user); }
      catch (reason) { navigate(`/tickets/${result.id}`, { replace: true, state: { attachmentWarning: `Ticket ${edit ? "updated" : "created"}, but one or more attachments could not be uploaded. ${attachmentErrorMessage(reason)}` } }); return; }
    }
    setStage("complete"); navigate(`/tickets/${result.id}`, { replace: true, state: { attachmentSuccess: files.length > 0 ? "Upload complete." : undefined } });
  };
  if (loading) return <LoadingState label={edit ? "Loading ticket" : "Preparing ticket form"} />;
  if (edit && !ticket) return <ErrorState message="This ticket does not exist." />;
  if (edit && ticket && (ticket.status !== "OPEN" || ticket.createdBy.id !== user?.id)) return <Navigate to={`/tickets/${ticket.id}`} replace />;
  const pendingLabel = stage === "uploading" ? "Uploading attachments…" : stage === "creating" ? edit ? "Updating ticket…" : "Creating ticket…" : "Saving…";
  return <div className="narrow-page"><Link className="back-link" to={edit && ticket ? `/tickets/${ticket.id}` : "/tickets"}><Icon name="back" />Back to {edit ? "ticket" : "my tickets"}</Link><section className="page-intro"><h2>{edit ? "Edit ticket" : "Create a support ticket"}</h2><p>{edit ? "Update the details below while your request is still open." : "Tell us what’s happening and the IT team will route your request."}</p></section>{error && <div className="inline-error" role="alert"><Icon name="alert" />{error}</div>}<form className="form-panel" onSubmit={submit}>
    <div className="form-section"><div className="form-section-heading"><span>1</span><div><h3>Issue details</h3><p>Give us enough information to understand the problem.</p></div></div><label className="field"><span>Title <b>*</b></span><input required maxLength={120} value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Briefly describe your issue" /><small>{form.title.length}/120</small></label><label className="field"><span>Description <b>*</b></span><textarea required rows={7} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="What happened? Include any error messages and steps you have already tried." /></label></div>
    <div className="form-section"><div className="form-section-heading"><span>2</span><div><h3>Category & location</h3><p>Choose a category or let HelpDesk assist with classification.</p></div></div><div className="two-col"><label className="field"><span>Category <b>*</b></span><select required value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}><option value="AUTO_DETECT">Not sure — detect automatically</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><small className="field-help">A selected category is preserved; auto-detect is advisory and can later be overridden.</small></label><label className="field"><span>Location <em>Optional</em></span><input value={form.location ?? ""} onChange={(event) => set("location", event.target.value)} placeholder="e.g. CL Building Room 402" /></label></div><div className="priority-note"><Icon name="life" /><div><strong>Classification is assisted automatically</strong><p>When you are unsure, HelpDesk assesses the description to suggest a category and priority. Technicians can correct these later.</p></div></div></div>
    <div className="form-section"><div className="form-section-heading"><span>3</span><div><h3>Attachments</h3><p>Add up to five JPEG, PNG, WebP, PDF, or text files. Maximum 13 MB each.</p></div></div><label className="dropzone"><Icon name="clip" /><strong>Choose files</strong><span>JPEG, PNG, WebP, PDF, or TXT</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.jpg,.jpeg,.png,.webp,.pdf,.txt" onChange={chooseFiles} /></label>{(form.files?.length ?? 0) > 0 && <ul className="file-list">{form.files?.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><Icon name="file" /><span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span><button type="button" disabled={saving} onClick={() => set("files", form.files?.filter((_, i) => i !== index) ?? [])} aria-label={`Remove selected file ${file.name}`}><Icon name="close" /></button></li>)}</ul>}</div>
    <div className="form-actions"><Link className="secondary-button" to={edit && ticket ? `/tickets/${ticket.id}` : "/tickets"}>Cancel</Link><button className="primary-button" disabled={saving || stage === "complete"}>{saving ? <><span className="spinner light" />{pendingLabel}</> : <>{edit ? "Save changes" : "Submit ticket"}<Icon name="arrow" /></>}</button></div>
  </form></div>;
}
