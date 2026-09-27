import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
  accent,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  accent?: "ok" | "warn" | "danger";
}) {
  const accentColor =
    accent === "ok"
      ? "border-l-status-ok"
      : accent === "warn"
      ? "border-l-status-warn"
      : accent === "danger"
      ? "border-l-status-danger"
      : "border-l-transparent";

  return (
    <div
      className={`rounded-md border border-line ${accentColor} border-l-[3px] bg-panel`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
