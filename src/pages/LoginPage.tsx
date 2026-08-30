import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/user";
import { Icon } from "../components/ui/Icon";
import { humanize } from "../components/tickets/TicketUI";
import { LoadingState } from "../components/ui/States";

const roles: UserRole[] = ["STUDENT", "FACULTY", "TECHNICIAN", "ADMIN"];
const authErrors: Record<string, string> = {
  INVALID_OAUTH_STATE: "Your sign-in session expired or could not be verified. Please start again.",
  MICROSOFT_AUTH_REJECTED: "Microsoft sign-in was cancelled or not completed.",
  MICROSOFT_CODE_MISSING: "Microsoft did not return the information needed to complete sign-in.",
  MICROSOFT_IDENTITY_INVALID: "Your Microsoft university identity could not be verified.",
  MICROSOFT_PROFILE_INCOMPLETE: "Your Microsoft profile is missing information required by HelpDesk. Contact the IT Service Desk.",
  MICROSOFT_IDENTITY_CONFLICT: "This HelpDesk account is linked to a different Microsoft identity. Contact the IT Service Desk.",
  ACCOUNT_INACTIVE: "Your HelpDesk account is inactive. Contact the IT Service Desk for assistance.",
  MICROSOFT_AUTH_FAILED: "Microsoft sign-in could not be completed. Please try again.",
};

export function LoginPage() {
  const auth = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [searchParams] = useSearchParams(); const [selected, setSelected] = useState<UserRole>("STUDENT"); const [submitting, setSubmitting] = useState(false); const [microsoftPending, setMicrosoftPending] = useState(false); const [error, setError] = useState("");
  if (auth.isLoading) return <main className="center-screen"><LoadingState label="Checking your HelpDesk session" /></main>;
  if (auth.isAuthenticated) return <Navigate to="/dashboard" replace />;
  const callbackError = searchParams.get("authError");
  const displayedError = error || (callbackError ? authErrors[callbackError] ?? "Sign-in could not be completed. Please try again or contact the IT Service Desk." : "");
  const clearCallbackError = () => { if (callbackError) navigate("/login", { replace: true }); };
  const microsoftLogin = () => { if (microsoftPending) return; clearCallbackError(); setError(""); setMicrosoftPending(true); auth.startMicrosoftLogin(); };
  const developmentLogin = async () => { if (submitting) return; clearCallbackError(); setSubmitting(true); setError(""); try { await auth.developmentLogin(selected); const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname; navigate(from ?? "/dashboard", { replace: true }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Development sign-in failed. Please try again."); setSubmitting(false); } };
  return <main className="login-page"><section className="login-visual"><div className="login-visual-inner"><div className="login-brand"><span className="brand-mark large"><Icon name="life" /></span><span><strong>HelpDesk</strong><small>University IT Support</small></span></div><div className="login-message"><span className="kicker">Campus technology, simplified</span><h1>Support when you need it, wherever you are.</h1><p>Submit requests, follow progress, and stay connected with the university IT team in one secure place.</p></div><div className="login-stats"><div><strong>24/7</strong><span>Request access</span></div><div><strong>One place</strong><span>For every IT issue</span></div></div></div></section><section className="login-panel"><div className="login-card"><span className="mobile-login-brand"><span className="brand-mark"><Icon name="life" /></span><strong>HelpDesk</strong></span><div className="login-heading"><span className="kicker">Welcome to HelpDesk</span><h2>University IT Support Portal</h2><p>Sign in with your university Microsoft account to access support services.</p></div>{displayedError && <div className="inline-error login-error" role="alert"><Icon name="alert" />{displayedError}</div>}<button className="microsoft-button" type="button" disabled={microsoftPending || submitting} onClick={microsoftLogin}><span className="ms-grid"><i /><i /><i /><i /></span>{microsoftPending ? "Redirecting to Microsoft…" : "Continue with Microsoft"}</button>{import.meta.env.DEV && <><div className="divider"><span>Development access</span></div><div className="dev-box"><div className="dev-label"><span>DEV</span><p><strong>Seeded development sign in</strong><small>Sends only the selected seeded user ID; the backend returns the role.</small></p></div><div className="role-grid">{roles.map((role) => <button key={role} type="button" disabled={submitting || microsoftPending} className={selected === role ? "role-option selected" : "role-option"} onClick={() => setSelected(role)}><span className="radio" />{humanize(role)}</button>)}</div><button className="primary-button full" onClick={developmentLogin} disabled={submitting || microsoftPending}>{submitting ? <><span className="spinner light" />Signing in…</> : <>Continue as seeded {humanize(selected)}<Icon name="arrow" /></>}</button></div></>}<p className="security-note">HelpDesk uses your university Microsoft identity and a secure server-managed session. Your Microsoft credentials are never handled by this application.</p></div></section></main>;
}
