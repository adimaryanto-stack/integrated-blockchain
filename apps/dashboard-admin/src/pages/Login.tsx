import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import type { AdminRole } from "@/types";

export function Login() {
  const { login, verifyMfa, pendingMfaUser, adminAccounts, quickLogin } = useAdminStore();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [email, setEmail] = useState("superadmin@integrated-blockchain.id");
  const [password, setPassword] = useState("PasswordSuper123!");
  const [mfaCode, setMfaCode] = useState("123456");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Email tidak boleh kosong.");
      return;
    }
    const success = login(email, password);
    if (success) {
      setStep("mfa");
    } else {
      setError("Akun tidak ditemukan. Gunakan salah satu akun demo di bawah.");
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mfaCode.length < 6) {
      setError("Kode MFA harus 6 digit angka.");
      return;
    }
    const verified = verifyMfa(mfaCode);
    if (verified) {
      navigate("/");
    } else {
      setError("Kode verifikasi salah atau kedaluwarsa.");
    }
  };

  const handleDemoSelect = (role: AdminRole) => {
    quickLogin(role);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 py-8">
      {/* Background Graphic Element */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gold shadow-lg shadow-gold/20">
            <ShieldCheck size={28} className="text-navy" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Dashboard Admin
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Platform Terpadu Pengawasan Anggaran Pendidikan Nasional (Port :2026)
          </p>
        </div>

        {/* Main Login Card */}
        <div className="rounded-lg border border-white/10 bg-panel p-7 shadow-2xl">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Alamat Email Administrator
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-2.5 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@integrated-blockchain.id"
                    className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-3 text-sm text-ink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-2.5 text-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-3 text-sm text-ink transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-sm bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
              >
                <span>Lanjutkan ke Verifikasi MFA</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy">
                  <KeyRound size={20} />
                </div>
                <h3 className="text-sm font-semibold text-ink">Verifikasi Dua Langkah (MFA TOTP)</h3>
                <p className="mt-1 text-xs text-muted">
                  Masukkan 6 digit kode dari Google Authenticator untuk akun{" "}
                  <strong className="text-navy">{pendingMfaUser?.email || email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="focus-ring w-full rounded-sm border border-line bg-panel py-2.5 text-center text-xl font-mono tracking-[0.5em] text-ink transition-colors"
                />
                <p className="mt-1.5 text-center text-[11px] text-muted">
                  Tip Demo: Kode default telah diisi otomatis (<code className="font-semibold text-navy">123456</code>).
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="focus-ring flex-1 rounded-sm border border-line py-2 text-xs font-medium text-muted hover:bg-base"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="focus-ring flex-1 rounded-sm bg-navy py-2 text-xs font-semibold text-white hover:bg-navy-light"
                >
                  Verifikasi & Masuk
                </button>
              </div>
            </form>
          )}

          {/* Quick Switch Demo Roles */}
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-2">
              <Sparkles size={14} className="text-gold" />
              <span>Akses Cepat Pengujian (Scoped RBAC):</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {adminAccounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleDemoSelect(a.role)}
                  className="flex items-center justify-between rounded border border-line/60 bg-base/50 p-2 text-left text-xs hover:border-navy/40 hover:bg-base transition-colors"
                >
                  <div>
                    <span className="font-semibold text-ink">{a.name}</span>
                    <span className="ml-1 text-[11px] text-muted capitalize">({a.role.replace("_", " ")})</span>
                    <p className="text-[10px] text-navy/70">
                      Scope: <code className="bg-white px-1 py-0.2 rounded">{a.scopeType}{a.scopeId ? `:${a.scopeId}` : ""}</code>
                    </p>
                  </div>
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-semibold text-navy">
                    Masuk Langsung &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/50">
          Sistem Pengawasan Internal · Terkoneksi ke PostgreSQL :2027 & Proxy :2028
        </p>
      </div>
    </div>
  );
}
