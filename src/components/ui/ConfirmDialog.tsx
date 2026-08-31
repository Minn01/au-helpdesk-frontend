import { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  icon?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, pendingLabel, cancelLabel = "Cancel", icon = "alert", tone = "default", pending = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const dialog = useRef<HTMLElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);

  useEffect(() => {
    onCancelRef.current = onCancel;
    pendingRef.current = pending;
  }, [onCancel, pending]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => cancelButton.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingRef.current) onCancelRef.current();
      if (event.key !== "Tab") return;
      const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
      if (buttons.length === 0) { event.preventDefault(); return; }
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKeyDown); previousFocus?.focus(); };
  }, [open]);

  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
    <section ref={dialog} className="modal" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}>
      <span className={`modal-icon ${tone === "danger" ? "danger" : "default"}`}><Icon name={icon} /></span>
      <h2 id={titleId}>{title}</h2>
      <p id={messageId}>{message}</p>
      <div className="modal-actions">
        <button ref={cancelButton} className="secondary-button" type="button" onClick={onCancel} disabled={pending}>{cancelLabel}</button>
        <button className={tone === "danger" ? "danger-button filled" : "primary-button"} type="button" onClick={onConfirm} disabled={pending}>{pending ? pendingLabel ?? "Working…" : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
