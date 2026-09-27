const toneMap: Record<string, string> = {
  aktif: "bg-status-ok/10 text-status-ok",
  online: "bg-status-ok/10 text-status-ok",
  sinkron: "bg-status-ok/10 text-status-ok",
  cocok: "bg-status-ok/10 text-status-ok",
  selesai: "bg-status-ok/10 text-status-ok",

  menunggu: "bg-status-warn/10 text-status-warn",
  tertunda: "bg-status-warn/10 text-status-warn",
  degraded: "bg-status-warn/10 text-status-warn",
  sedang: "bg-status-warn/10 text-status-warn",
  ditinjau: "bg-status-warn/10 text-status-warn",

  nonaktif: "bg-status-danger/10 text-status-danger",
  offline: "bg-status-danger/10 text-status-danger",
  gagal: "bg-status-danger/10 text-status-danger",
  tinggi: "bg-status-danger/10 text-status-danger",
  "tidak cocok": "bg-status-danger/10 text-status-danger",
  baru: "bg-status-danger/10 text-status-danger",
};

export function StatusBadge({ value }: { value: string }) {
  const tone = toneMap[value] ?? "bg-muted/10 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {value}
    </span>
  );
}
