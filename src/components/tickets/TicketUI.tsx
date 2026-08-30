import type { TicketPriority, TicketStatus } from "../../types/ticket";
// eslint-disable-next-line react-refresh/only-export-components
export const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
export function StatusBadge({ status }: { status: TicketStatus }) { return <span className={`badge status-${status.toLowerCase()}`}><span className="badge-dot" />{humanize(status)}</span>; }
export function PriorityBadge({ priority }: { priority: TicketPriority }) { return <span className={`badge priority-${priority.toLowerCase()}`}>{priority === "URGENT" && "! "}{humanize(priority)}</span>; }
// eslint-disable-next-line react-refresh/only-export-components
export const formatDate = (value: string, includeTime = false) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}) }).format(new Date(value));
export function Initials({ name, small = false }: { name: string; small?: boolean }) { return <span className={`avatar ${small ? "avatar-small" : ""}`} aria-hidden="true">{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>; }
