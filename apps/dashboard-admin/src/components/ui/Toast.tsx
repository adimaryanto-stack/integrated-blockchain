import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import type { ToastMessage } from "@/store/adminStore";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="text-status-ok shrink-0" size={18} />,
          warning: <AlertTriangle className="text-status-warn shrink-0" size={18} />,
          error: <AlertCircle className="text-status-danger shrink-0" size={18} />,
          info: <Info className="text-navy shrink-0" size={18} />,
        };

        const borderColors = {
          success: "border-l-status-ok",
          warning: "border-l-status-warn",
          error: "border-l-status-danger",
          info: "border-l-navy",
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-md border border-line bg-panel p-3.5 shadow-lg border-l-[4px] ${borderColors[toast.type]} transition-all animate-in slide-in-from-bottom-2`}
          >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-ink leading-snug">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-muted hover:text-ink -mr-1 -mt-1 p-1 rounded-sm"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
