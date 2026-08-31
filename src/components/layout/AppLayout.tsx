import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Icon } from "../ui/Icon";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Initials, humanize } from "../tickets/TicketUI";
import appLogo from "../../assets/logo_icon_128.png";

const navigation = {
  STUDENT: [["Dashboard", "/dashboard", "dashboard"], ["My Tickets", "/tickets", "ticket"], ["Create Ticket", "/tickets/new", "plus"]],
  FACULTY: [["Dashboard", "/dashboard", "dashboard"], ["My Tickets", "/tickets", "ticket"], ["Create Ticket", "/tickets/new", "plus"]],
  TECHNICIAN: [["Dashboard", "/dashboard", "dashboard"], ["Ticket Queue", "/queue", "queue"], ["My Assigned Tickets", "/assigned", "ticket"]],
  ADMIN: [["Dashboard", "/dashboard", "dashboard"], ["Tickets", "/admin/tickets", "ticket"], ["Categories", "/admin/categories", "category"], ["Users / Technicians", "/admin/users", "users"]],
} as const;
const titles: Record<string, string> = { "/dashboard": "Dashboard", "/tickets": "My Tickets", "/tickets/new": "Create Ticket", "/queue": "Ticket Queue", "/assigned": "My Assigned Tickets", "/admin/tickets": "All Tickets", "/admin/categories": "Categories", "/admin/users": "Users / Technicians" };

export function AppLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [open, setOpen] = useState(false); const [confirmingLogout, setConfirmingLogout] = useState(false); const [loggingOut, setLoggingOut] = useState(false); const [logoutError, setLogoutError] = useState("");
  if (!user) return null;
  const title = location.pathname.match(/^\/tickets\/[^/]+\/edit$/) ? "Edit Ticket" : location.pathname.match(/^\/tickets\/[^/]+$/) ? "Ticket Details" : (titles[location.pathname] ?? "HelpDesk");
  const doLogout = async () => { if (loggingOut) return; setLoggingOut(true); setLogoutError(""); try { await logout(); navigate("/login", { replace: true }); } catch { setLogoutError("Log out could not be completed. Please try again."); setLoggingOut(false); setConfirmingLogout(false); } };
  return <div className="app-shell">
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><img className="sidebar-logo" src={appLogo} alt="" /><span><strong>AU HelpDesk</strong><small>University IT</small></span><button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="close" /></button></div>
      <nav aria-label="Main navigation">{navigation[user.role].map(([label, href, icon]) => <NavLink key={href} to={href} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><Icon name={icon} />{label}</NavLink>)}</nav>
      <div className="sidebar-help"><span><Icon name="life" /></span><strong>Need urgent help?</strong><p>Call IT Service Desk<br /><b>Ext. 4357 (HELP)</b></p></div>
      {logoutError && <div className="sidebar-logout-error" role="alert">{logoutError}</div>}<div className="sidebar-user"><Initials name={user.name} small /><span><strong>{user.name}</strong><small>{humanize(user.role)}</small></span><button onClick={() => setConfirmingLogout(true)} disabled={loggingOut} aria-label={loggingOut ? "Logging out" : "Log out"} title={loggingOut ? "Logging out…" : "Log out"}>{loggingOut ? <span className="spinner light" /> : <Icon name="logout" />}</button></div>
    </aside>
    <div className="app-main"><header className="topbar"><button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button><div><span className="eyebrow-mobile">HelpDesk</span><h1>{title}</h1></div></header><main className="content"><Outlet /></main></div>
    <ConfirmDialog open={confirmingLogout} title="Log out of HelpDesk?" message="You’ll need to sign in with your university Microsoft account to access HelpDesk again." confirmLabel="Yes, log out" pendingLabel="Logging out…" cancelLabel="Stay signed in" icon="logout" pending={loggingOut} onConfirm={doLogout} onCancel={() => setConfirmingLogout(false)} />
  </div>;
}
