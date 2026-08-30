"use client";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getReport } from "@/lib/api/client";
import type { ReportDetail } from "@/lib/types";
import { BiomarkerTable } from "@/components/BiomarkerTable";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { RiskFlagCard } from "@/components/RiskFlagCard";
import { formatDate, OVERALL_STATUS_CONFIG } from "@/lib/utils";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    let token: string | undefined;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch {
      // Optional guest mode
    }

    try {
      const data = await getReport(id, token);
      setReport(data);
      if (data.status === "pending" || data.status === "processing") {
        setTimeout(() => fetchReport(), 1500); // poll faster
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Report not found or access denied.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div className="skeleton" style={{ height: 32, width: "40%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: "25%", marginBottom: 40 }} />
        <div className="skeleton" style={{ height: 300, marginBottom: 20, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="card" style={{ padding: 48, textAlign: "center", maxWidth: 500, margin: "60px auto" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
        <h2 style={{ color: "#0f172a", marginBottom: 8 }}>{error || "Report not found"}</h2>
        <Link href="/dashboard" className="btn-primary" style={{ display: "inline-flex", marginTop: 16 }}>← Back to Reports</Link>
      </div>
    );
  }

  const isProcessing = report.status === "pending" || report.status === "processing";
  const overallCfg = report.summary ? OVERALL_STATUS_CONFIG[report.summary.overall_status] : OVERALL_STATUS_CONFIG.normal;

  const validBiomarkers = report.biomarkers ? report.biomarkers.filter(b => b.status !== "UNKNOWN") : [];
  const numericBiomarkers = validBiomarkers.filter(b => !b.is_qualitative);
  const abnormalCount = numericBiomarkers.filter(b => b.status !== "NORMAL" && b.status !== "INFORMATIONAL").length;
  const normalCount = numericBiomarkers.filter(b => b.status === "NORMAL").length;

  const fallbackSummary = report.summary || {
    overall_status: "normal" as const,
    risk_flags: [],
    gemini_summary: `This ${report.report_type || "Lab"} report has been analyzed. Total ${validBiomarkers.length} biomarker test parameters were extracted and evaluated.`,
    gemini_abnormal: "",
    gemini_questions: "",
    gemini_lifestyle: "• Maintain a balanced diet, regular exercise, and consult your primary care doctor to discuss these lab results.",
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1160, margin: "0 auto", paddingBottom: 60 }}>
      {/* Top Bar Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: 16,
            color: "#64748b",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            transition: "color 0.2s",
          }}
        >
          ← Reports
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="card" style={{ padding: "32px 36px", marginBottom: 28, background: "#ffffff" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{report.file_name}</h1>
              {report.report_type && (
                <span style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: 6,
                }}>
                  {report.report_type}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 15, color: "#64748b", fontWeight: 500 }}>
              <span>Uploaded {formatDate(report.created_at)}</span>
              {report.lab_name && <span>Lab: {report.lab_name}</span>}
              {report.report_date && <span>Date: {formatDate(report.report_date)}</span>}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {report.status === "completed" && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Overall Status Badge */}
              <div style={{
                padding: "10px 22px",
                borderRadius: 12,
                border: "1px solid",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }} className={`${overallCfg.bg} ${overallCfg.color}`}>
                <span style={{ fontSize: 18 }}>{report.summary?.overall_status === "normal" ? "✓" : "!"}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{overallCfg.label}</span>
              </div>

              {/* Stats Counters */}
              <div style={{ display: "flex", gap: 1, background: "#e2e8f0", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <div style={{ background: "#ffffff", padding: "10px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{validBiomarkers.length}</div>
                </div>
                <div style={{ background: "#ffffff", padding: "10px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, textTransform: "uppercase" }}>Normal</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{normalCount}</div>
                </div>
                <div style={{ background: "#ffffff", padding: "10px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: abnormalCount > 0 ? "#ea580c" : "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Abnormal</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: abnormalCount > 0 ? "#ea580c" : "#64748b" }}>{abnormalCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="card" style={{ padding: 48, textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #0284c7", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
          <h2 style={{ color: "#0f172a", marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Analyzing report parameters…</h2>
          <p style={{ color: "#64748b", fontSize: 16 }}>This page will automatically update once analysis finishes.</p>
        </div>
      )}

      {/* Failed State */}
      {report.status === "failed" && (
        <div style={{ padding: "20px 26px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12, marginBottom: 28, color: "#be123c", fontSize: 16 }}>
          Processing failed: {report.processing_error || "Unknown error. Please re-upload the document."}
        </div>
      )}

      {/* Content Sections */}
      {report.status === "completed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Risk Flags Indicator */}
          {report.summary && report.summary.risk_flags.length > 0 && (
            <RiskFlagCard flags={report.summary.risk_flags} />
          )}

          {/* AI Explanation Brief */}
          <ExplanationPanel summary={fallbackSummary} />

          {/* Biomarker Table */}
          <BiomarkerTable biomarkers={validBiomarkers} />

          {/* Discreet Footer Medical Note */}
          <div style={{ textAlign: "center", paddingTop: 16, color: "#94a3b8", fontSize: 14 }}>
            Educational tool only — does not provide medical diagnosis or replace consultation with a physician.
          </div>
        </div>
      )}
    </div>
  );
}
