"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { listReports, deleteReport } from "@/lib/api/client";
import type { ReportListItem } from "@/lib/types";
import { formatDate, OVERALL_STATUS_CONFIG } from "@/lib/utils";

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="skeleton" style={{ height: 18, width: "60%", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 13, width: "40%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 13, width: "30%" }} />
    </div>
  );
}

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    let token: string | undefined;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch {}

    try {
      const data = await listReports(token);
      setReports(data);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this report and all its data?")) return;
    let token: string | undefined;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch {}

    setDeleting(id);
    try {
      await deleteReport(id, token);
      setReports(prev => prev.filter(r => r.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const statusCounts = {
    normal: reports.filter(r => r.overall_status === "normal").length,
    attention: reports.filter(r => r.overall_status === "attention").length,
    urgent: reports.filter(r => r.overall_status === "urgent").length,
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>My Reports</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Upload and track your medical lab reports over time</p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">
          + Upload Report
        </Link>
      </div>

      {/* Summary stats */}
      {reports.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Reports", value: reports.length, color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
            { label: "All Normal", value: statusCounts.normal, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
            { label: "Needs Attention", value: statusCounts.attention, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
            { label: "Follow Up Soon", value: statusCounts.urgent, color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "20px", textAlign: "center", background: s.bg, borderColor: s.border }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: "14px 18px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, color: "#e11d48", fontSize: 14, marginBottom: 20 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🩺</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>No reports yet</h2>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>Upload your first medical report to get started</p>
          <Link href="/dashboard/upload" className="btn-primary">Upload Your First Report</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map(r => {
            const statusCfg = r.overall_status ? OVERALL_STATUS_CONFIG[r.overall_status] : null;
            const isProcessing = r.status === "pending" || r.status === "processing";
            return (
              <div key={r.id} className="card card-hover" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {r.file_name.endsWith(".pdf") ? "📄" : "🖼️"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.file_name}</span>
                    {r.report_type && (
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", fontWeight: 600 }}>
                        {r.report_type}
                      </span>
                    )}
                    {isProcessing && (
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", animation: "pulse-glow 2s ease infinite" }}>
                        Processing…
                      </span>
                    )}
                    {r.status === "failed" && (
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}>Failed</span>
                    )}
                    {statusCfg && r.status === "completed" && (
                      <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, border: "1px solid" }} className={`${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 16 }}>
                    <span>Uploaded {formatDate(r.created_at)}</span>
                    {r.lab_name && <span>🏥 {r.lab_name}</span>}
                    {r.report_date && <span>📅 {formatDate(r.report_date)}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {r.status === "completed" && (
                    <Link href={`/dashboard/reports/${r.id}`} className="btn-secondary" style={{ fontSize: 13, padding: "6px 14px" }}>
                      View →
                    </Link>
                  )}
                  <button className="btn-danger" onClick={() => handleDelete(r.id)} disabled={deleting === r.id} style={{ fontSize: 12, padding: "6px 12px" }}>
                    {deleting === r.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
