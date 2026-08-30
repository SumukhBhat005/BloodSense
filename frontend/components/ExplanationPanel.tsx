import React from "react";
import type { Summary } from "@/lib/types";

interface Props { summary: Summary; }

function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index} style={{ fontWeight: 700, color: "#0f172a" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index} style={{ fontStyle: "italic", color: "#334155" }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function Section({
  title,
  content,
  accentColor = "#0284c7",
}: {
  title: string;
  content: string;
  accentColor?: string;
}) {
  if (!content) return null;
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        paddingLeft: 14,
        borderLeft: `4px solid ${accentColor}`,
      }}>
        <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</h3>
      </div>
      <div style={{ fontSize: 17, color: "#334155", lineHeight: 1.8, paddingLeft: 18, fontWeight: 500 }}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          const isBullet = trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*") || /^\d+\./.test(trimmed);
          const cleanLine = trimmed.replace(/^[-•*]\s*|^\d+\.\s*/, "");
          return isBullet ? (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: accentColor, flexShrink: 0, fontWeight: 800, fontSize: 16, marginTop: 2 }}>•</span>
              <div style={{ flex: 1 }}>{renderFormattedText(cleanLine)}</div>
            </div>
          ) : (
            <p key={i} style={{ marginBottom: 10 }}>{renderFormattedText(trimmed)}</p>
          );
        })}
      </div>
    </div>
  );
}

export function ExplanationPanel({ summary }: Props) {
  const hasSections = summary.gemini_summary || summary.gemini_abnormal || summary.gemini_questions || summary.gemini_lifestyle;

  return (
    <div className="card" style={{ padding: "36px 40px", background: "#ffffff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 32, paddingBottom: 22, borderBottom: "1px solid #f1f5f9" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>AI Health Briefing</h2>
          <p style={{ fontSize: 15, color: "#64748b", marginTop: 3 }}>Clinical pattern analysis & key insights</p>
        </div>
        <span style={{ fontSize: 13, color: "#64748b", background: "#f8fafc", padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontWeight: 600 }}>
          Powered by Gemini 2.0 Flash
        </span>
      </div>

      {hasSections ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <Section title="Overview" content={summary.gemini_summary} accentColor="#0284c7" />
          <Section title="Abnormal Findings" content={summary.gemini_abnormal} accentColor="#ea580c" />
          <Section title="Lifestyle Considerations" content={summary.gemini_lifestyle} accentColor="#059669" />
        </div>
      ) : (
        <div style={{ padding: "20px 0", color: "#64748b", fontSize: 16 }}>
          All biomarker parameters evaluated are recorded below.
        </div>
      )}
    </div>
  );
}
