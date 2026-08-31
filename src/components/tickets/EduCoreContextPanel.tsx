import { useState } from "react";
import { eduCoreApi, eduCoreErrorMessage, isNeutralEduCoreError } from "../../api/educore.api";
import type { EduCoreRegistrationContext } from "../../types/educore";
import { Icon } from "../ui/Icon";
import { formatDate, humanize } from "./TicketUI";

const safeAdditionalValues = (context: Record<string, unknown> | null) => Object.entries(context ?? {}).flatMap(([key, value]) => {
  const text = String(value).trim();
  if (/key|token|secret|password|credential|event.?id|internal|stack/i.test(key) || (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") || text === "" || text.length > 200) return [];
  return [{ key, label: humanize(key.replace(/([a-z])([A-Z])/g, "$1_$2")), value: text }];
}).slice(0, 6);

export function EduCoreContextPanel({ ticketId }: { ticketId: string }) {
  const [context, setContext] = useState<EduCoreRegistrationContext | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [neutral, setNeutral] = useState(false);
  const load = async () => { if (loading) return; setLoading(true); setError(""); setNeutral(false); try { setContext(await eduCoreApi.getContext(ticketId)); } catch (reason) { setContext(null); setNeutral(isNeutralEduCoreError(reason)); setError(eduCoreErrorMessage(reason)); } finally { setLoading(false); } };
  const additional = safeAdditionalValues(context?.additionalContext ?? null);
  return <section className="panel detail-section educore-panel"><div className="section-title"><div><h3>EduCore Registration Context</h3><p>Diagnostic registration information retrieved from EduCore on demand.</p></div>{context && <button className="text-button" type="button" disabled={loading} onClick={load}>Refresh</button>}</div>{!context && !error && <div className="educore-prompt"><p>This Course Registration ticket may have related EduCore diagnostic information.</p><button className="secondary-button" type="button" disabled={loading} onClick={load}>{loading ? <><span className="spinner" />Loading registration context…</> : "Load registration context"}</button></div>}{error && <div className={neutral ? "educore-neutral" : "inline-error"} role={neutral ? "status" : "alert"}><Icon name={neutral ? "life" : "alert"} /><span>{error}</span>{!neutral && <button className="text-button" type="button" disabled={loading} onClick={load}>{loading ? "Retrying…" : "Retry"}</button>}</div>}{context && <dl className="educore-grid"><div><dt>Course</dt><dd>{context.courseCode}</dd></div><div><dt>Registration status</dt><dd><span className="badge status-cancelled">{humanize(context.registrationStatus)}</span></dd></div>{context.failureReason && <div className="wide"><dt>Failure reason</dt><dd>{context.failureReason}</dd></div>}<div><dt>Attempted at</dt><dd>{formatDate(context.attemptedAt, true)}</dd></div>{context.studentId && <div><dt>Student reference</dt><dd>{context.studentId}</dd></div>}{additional.map((item) => <div key={item.key}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}</section>;
}
