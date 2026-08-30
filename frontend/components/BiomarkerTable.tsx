"use client";
import { useState } from "react";
import type { BiomarkerResult, BiomarkerStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatValue } from "@/lib/utils";

interface Props {
  biomarkers: BiomarkerResult[];
}

const STATUS_ORDER: BiomarkerStatus[] = [
  "CRITICAL_HIGH", "CRITICAL_LOW", "HIGH", "LOW", "BORDERLINE_HIGH", "BORDERLINE_LOW", "NORMAL", "INFORMATIONAL", "UNKNOWN",
];

export function BiomarkerTable({ biomarkers }: Props) {
  const [filter, setFilter] = useState<"all" | "abnormal" | "qualitative">("all");
  const [search, setSearch] = useState("");

  const validBiomarkers = biomarkers.filter(b => b.status !== "UNKNOWN");
  const numericBiomarkers = validBiomarkers.filter(b => !b.is_qualitative);
  const qualitativeBiomarkers = validBiomarkers.filter(b => b.is_qualitative);

  const displayed = validBiomarkers
    .filter(b => {
      if (filter === "abnormal") return !b.is_qualitative && b.status !== "NORMAL" && b.status !== "INFORMATIONAL";
      if (filter === "qualitative") return b.is_qualitative;
      return true;
    })
    .filter(b => b.display_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const abnormalCount = numericBiomarkers.filter(b => b.status !== "NORMAL" && b.status !== "INFORMATIONAL").length;

  return (
    <div className="card" style={{ overflow: "hidden", background: "#ffffff" }}>
      {/* Header & Controls Toolbar */}
      <div style={{ padding: "28px 36px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18, marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>Biomarker Results</h2>
            <p style={{ fontSize: 15, color: "#64748b", marginTop: 3 }}>{validBiomarkers.length} test parameters cataloged</p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "abnormal", ...(qualitativeBiomarkers.length > 0 ? ["qualitative"] : [])] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: `1px solid ${filter === f ? "#0284c7" : "#e2e8f0"}`,
                  background: filter === f ? "#f0f9ff" : "#ffffff",
                  color: filter === f ? "#0284c7" : "#64748b",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {f === "all"
                  ? `All (${validBiomarkers.length})`
                  : f === "abnormal"
                  ? `Abnormal (${abnormalCount})`
                  : `Qualitative (${qualitativeBiomarkers.length})`
                }
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <input
          className="input-light"
          style={{ width: "100%", padding: "12px 18px", fontSize: 16, borderRadius: 12, background: "#f8fafc", borderColor: "#e2e8f0" }}
          placeholder="Filter tests by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {displayed.length === 0 ? (
        <div style={{ padding: 56, textAlign: "center", color: "#64748b", fontSize: 16 }}>
          {filter === "abnormal" ? "All values are within normal limits." : "No matching test results found."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table-light">
            <thead>
              <tr>
                <th style={{ fontSize: 14, padding: "16px 36px", color: "#64748b", fontWeight: 700 }}>Test Name</th>
                <th style={{ fontSize: 14, padding: "16px 36px", color: "#64748b", fontWeight: 700 }}>Measured Value</th>
                <th style={{ fontSize: 14, padding: "16px 36px", color: "#64748b", fontWeight: 700 }}>Reference Range</th>
                <th style={{ fontSize: 14, padding: "16px 36px", color: "#64748b", fontWeight: 700 }}>Ref Source</th>
                <th style={{ fontSize: 14, padding: "16px 36px", color: "#64748b", fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(b => (
                <tr key={b.id || b.canonical_name} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "18px 36px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 17 }}>{b.display_name}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 3 }}>{b.canonical_name}</div>
                  </td>
                  <td style={{ padding: "18px 36px", fontFamily: "monospace", color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                    {b.is_qualitative ? (
                      <span style={{
                        background: "#f1f5f9",
                        color: "#0369a1",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontSize: 15,
                        fontWeight: 700,
                      }}>
                        {b.qualitative_value || "—"}
                      </span>
                    ) : (
                      formatValue(b.value_normalized, b.unit_normalized)
                    )}
                  </td>
                  <td style={{ padding: "18px 36px", color: "#334155", fontSize: 16, fontWeight: 500 }}>
                    {b.is_qualitative
                      ? "—"
                      : b.reference_min != null && b.reference_max != null
                      ? `${b.reference_min}–${b.reference_max} ${b.unit_normalized}`
                      : b.reference_max != null
                      ? `<${b.reference_max} ${b.unit_normalized}`
                      : "—"}
                  </td>
                  <td style={{ padding: "18px 36px" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: b.reference_source === "report" ? "#0284c7" : "#64748b" }}>
                      {b.reference_source === "report" ? "Lab Report" : "Standard Ref"}
                    </span>
                  </td>
                  <td style={{ padding: "18px 36px" }}><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
