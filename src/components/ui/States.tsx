import { Icon } from "./Icon";
import type { ReactNode } from "react";
export function LoadingState({ label = "Loading" }: { label?: string }) { return <div className="state-box" role="status"><span className="spinner" />{label}…</div>; }
export function ErrorState({ message = "Something went wrong.", retry }: { message?: string; retry?: () => void }) { return <div className="state-box error-state"><Icon name="alert" /><div><strong>We couldn't load this page</strong><p>{message}</p>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div></div>; }
export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) { return <div className="empty-state"><div className="empty-icon"><Icon name="ticket" /></div><h3>{title}</h3><p>{message}</p>{action}</div>; }
