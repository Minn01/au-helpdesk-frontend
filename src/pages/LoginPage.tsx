import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Icon } from "../components/ui/Icon";
import { LoadingState } from "../components/ui/States";

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
  const auth = useAuth(); const navigate = useNavigate(); const [searchParams] = useSearchParams(); const [microsoftPending, setMicrosoftPending] = useState(false);
  if (auth.isLoading) return <main className="center-screen"><LoadingState label="Checking your HelpDesk session" /></main>;
  if (auth.isAuthenticated) return <Navigate to="/dashboard" replace />;
  const callbackError = searchParams.get("authError");
  const displayedError = callbackError ? authErrors[callbackError] ?? "Sign-in could not be completed. Please try again or contact the IT Service Desk." : "";
  const clearCallbackError = () => { if (callbackError) navigate("/login", { replace: true }); };
  const microsoftLogin = () => { if (microsoftPending) return; clearCallbackError(); setMicrosoftPending(true); auth.startMicrosoftLogin(); };
  return <main className="login-page"><section className="login-visual"><div className="login-visual-inner"><div className="login-brand"><span className="brand-mark large"><Icon name="life" /></span><span><strong>HelpDesk</strong><small>University IT Support</small></span></div><div className="login-message"><span className="kicker">Campus technology, simplified</span><h1>Support when you need it, wherever you are.</h1><p>Submit requests, follow progress, and stay connected with the university IT team in one secure place.</p></div><div className="login-stats"><div><strong>24/7</strong><span>Request access</span></div><div><strong>One place</strong><span>For every IT issue</span></div></div></div></section><section className="login-panel"><div className="login-card"><span className="mobile-login-brand"><span className="brand-mark"><Icon name="life" /></span><strong>HelpDesk</strong></span><div className="login-heading"><span className="kicker">Welcome to HelpDesk</span><h2>University IT Support Portal</h2><p>Sign in with your university Microsoft account to access support services.</p></div>{displayedError && <div className="inline-error login-error" role="alert"><Icon name="alert" />{displayedError}</div>}<button className="microsoft-button" type="button" disabled={microsoftPending} onClick={microsoftLogin}><span className="ms-grid"><i /><i /><i /><i /></span>{microsoftPending ? "Redirecting to Microsoft…" : "Continue with Microsoft"}</button><p className="login-account-guidance">Use your university Microsoft account. Your HelpDesk access and navigation are determined securely after sign-in.</p><p className="security-note">HelpDesk uses a secure server-managed session. Your Microsoft credentials are never handled by this application.</p></div></section></main>;
}
