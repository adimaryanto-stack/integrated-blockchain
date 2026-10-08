import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
  accent,
  icon: Icon,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  accent?: "ok" | "warn" | "danger";
  icon?: React.ComponentType<any>;
  className?: string;
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
      className={`rounded-md border border-line ${accentColor} border-l-[3px] bg-panel ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          {title && (
            <div className="flex items-center gap-2">
              {Icon && <Icon size={16} className="text-navy" />}
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
            </div>
          )}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
