import React, { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastContainer } from "@/components/ui/Toast";
import { useAdminStore } from "@/store/adminStore";
import { ShieldAlert, ArrowRight } from "lucide-react";

const routeModuleMap: Record<string, string> = {
  "/": "Beranda",
  "/users": "Manajemen Pengguna",
  "/audit-log": "Audit Log",
  "/data-sources": "Data Source Monitor",
  "/ai-faa": "AI-FAA Console",
  "/bank-mutations": "Mutasi Bank Himbara",
  "/broadcast": "Broadcast",
  "/wilayah": "Master Data Wilayah",
  "/access-control": "Access Control Matrix",
};

export function DashboardLayout({
  pageTitle,
  children,
}: {
  pageTitle: string;
  children: ReactNode;
}) {
  const { currentUser, toasts, dismissToast, canAccess, quickLogin } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const currentModuleName = routeModuleMap[location.pathname] || pageTitle;
  const isHome = location.pathname === "/";
  const hasAccess = isHome || canAccess(currentModuleName, "view");

  return (
    <div className="flex h-screen overflow-hidden bg-base text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!hasAccess ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-panel border border-line rounded-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-danger/10 text-status-danger mb-4">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-xl font-bold text-ink">Akses Terbatas (403 Forbidden)</h2>
              <p className="mt-2 text-sm text-muted max-w-md">
                Peran Anda saat ini (<strong className="text-ink">{currentUser.role}</strong> dengan cakupan <strong>{currentUser.scopeType}</strong>) tidak memiliki izin untuk melihat modul <strong className="text-navy">{currentModuleName}</strong> sesuai Access Control Matrix.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => quickLogin("super_admin")}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light transition-colors"
                >
                  Beralih ke Super Admin <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="focus-ring inline-flex items-center rounded-sm border border-line bg-panel px-4 py-2 text-xs font-medium text-ink hover:bg-base transition-colors"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
