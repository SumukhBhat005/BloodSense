import type { RiskFlag } from "@/lib/types";

interface Props { flags: RiskFlag[]; }

const SEVERITY_STYLE: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  info: { bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1", icon: "ℹ️" },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", icon: "⚠️" },
  critical: { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", icon: "🚨" },
};

export function RiskFlagCard({ flags }: Props) {
  if (!flags.length) return null;
  return (
    <div className="card" style={{ padding: "32px 36px", background: "#ffffff" }}>
      <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid #f1f5f9" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>Pattern Highlights</h2>
        <p style={{ fontSize: 15, color: "#64748b", marginTop: 3 }}>Informational pattern indicators identified from biomarker values</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {flags.map(flag => {
          const s = SEVERITY_STYLE[flag.severity] || SEVERITY_STYLE.info;
          return (
            <div
              key={flag.id}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 14,
                padding: "18px 24px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 22, marginTop: 2 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 4 }}>{flag.label}</div>
                <div style={{ fontSize: 16, color: "#334155", lineHeight: 1.7, fontWeight: 500 }}>{flag.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
