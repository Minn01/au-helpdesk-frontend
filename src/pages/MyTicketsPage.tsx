import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoriesApi } from "../api/categories.api";
import { ticketsApi } from "../api/tickets.api";
import { useAuth } from "../contexts/AuthContext";
import type { Category, Ticket, TicketFilters, TicketPriority, TicketStatus } from "../types/ticket";
import { Icon } from "../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { PriorityBadge, StatusBadge, formatDate, humanize } from "../components/tickets/TicketUI";

const statuses: (TicketStatus | "ALL")[] = ["ALL", "OPEN", "CLAIMED", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"];
const priorities: (TicketPriority | "ALL")[] = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];
export function MyTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({ status: "ALL", priority: "ALL", categoryId: "ALL", sort: "newest" });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { categoriesApi.getCategories().then(setCategories); }, []);
  useEffect(() => { if (!user) return; const timer = window.setTimeout(() => { setLoading(true); setError(""); ticketsApi.getMyTickets(user.id, filters).then(setTickets).catch(() => setError("We couldn't retrieve your tickets.")).finally(() => setLoading(false)); }, 180); return () => window.clearTimeout(timer); }, [user, filters]);
  const update = (key: keyof TicketFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const hasFilters = Boolean(filters.search || filters.status !== "ALL" || filters.priority !== "ALL" || filters.categoryId !== "ALL");
  return <div className="page-stack">
    <section className="page-intro split"><div><h2>My tickets</h2><p>Track and manage all your IT support requests.</p></div><Link className="primary-button" to="/tickets/new"><Icon name="plus" />Create ticket</Link></section>
    <section className="panel filter-panel">
      <div className="filter-bar"><label className="search-field"><span className="sr-only">Search tickets</span><Icon name="search" /><input value={filters.search ?? ""} onChange={(event) => update("search", event.target.value)} placeholder="Search by ticket number or title" /></label><label><span className="sr-only">Status</span><select value={filters.status} onChange={(event) => update("status", event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item === "ALL" ? "All statuses" : humanize(item)}</option>)}</select></label><label><span className="sr-only">Priority</span><select value={filters.priority} onChange={(event) => update("priority", event.target.value)}>{priorities.map((item) => <option key={item} value={item}>{item === "ALL" ? "All priorities" : humanize(item)}</option>)}</select></label><label><span className="sr-only">Category</span><select value={filters.categoryId} onChange={(event) => update("categoryId", event.target.value)}><option value="ALL">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span className="sr-only">Sort</span><select value={filters.sort} onChange={(event) => update("sort", event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
      {loading ? <LoadingState label="Loading tickets" /> : error ? <ErrorState message={error} /> : tickets.length === 0 ? <EmptyState title="No tickets found" message={hasFilters ? "Try changing or clearing your filters." : "You haven't submitted any support tickets yet."} action={<Link className="primary-button" to="/tickets/new">Create your first ticket</Link>} /> : <><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Created</th><th /></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><Link to={`/tickets/${ticket.id}`}><span>{ticket.ticketNumber}</span><strong>{ticket.title}</strong></Link></td><td>{ticket.category.name}</td><td><PriorityBadge priority={ticket.priority} /></td><td><StatusBadge status={ticket.status} /></td><td>{ticket.assignedTechnician?.name ?? <span className="muted">Unassigned</span>}</td><td>{formatDate(ticket.createdAt)}</td><td><Link aria-label={`Open ${ticket.ticketNumber}`} to={`/tickets/${ticket.id}`}><Icon className="row-chevron" name="chevron" /></Link></td></tr>)}</tbody></table></div><div className="mobile-ticket-cards">{tickets.map((ticket) => <Link to={`/tickets/${ticket.id}`} className="mobile-ticket" key={ticket.id}><div><span className="ticket-number">{ticket.ticketNumber}</span><StatusBadge status={ticket.status} /></div><h3>{ticket.title}</h3><p>{ticket.category.name} · {formatDate(ticket.createdAt)}</p><div><PriorityBadge priority={ticket.priority} /><span>{ticket.assignedTechnician?.name ?? "Unassigned"}</span></div></Link>)}</div><div className="results-count">Showing {tickets.length} ticket{tickets.length === 1 ? "" : "s"}</div></>}
    </section>
  </div>;
}
