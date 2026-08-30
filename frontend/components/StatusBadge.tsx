import { STATUS_CONFIG } from "@/lib/utils";
import type { BiomarkerStatus } from "@/lib/types";

interface Props {
  status: BiomarkerStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "3px 10px" : "5px 14px",
        borderRadius: 999,
        fontSize: size === "sm" ? 13 : 15,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
      className={`badge ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%" }} className={cfg.dot} />
      {cfg.label}
    </span>
  );
}
