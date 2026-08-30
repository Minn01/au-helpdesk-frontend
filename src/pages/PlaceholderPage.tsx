import { Icon } from "../components/ui/Icon";
export function PlaceholderPage() { return <section className="panel placeholder"><span><Icon name="queue" /></span><h2>This workspace is coming next</h2><p>The navigation and access structure are ready. Technician and administrator workflows will be connected in a later phase.</p></section>; }
export function NotFoundPage() { return <main className="not-found"><span>404</span><h1>Page not found</h1><p>The page you’re looking for doesn’t exist or has moved.</p><a className="primary-button" href="/dashboard">Return to dashboard</a></main>; }
