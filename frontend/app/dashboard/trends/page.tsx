"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAllTrends } from "@/lib/api/client";
import type { AllTrendsResponse, TrendResponse } from "@/lib/types";
import { TREND_CONFIG, STATUS_CONFIG, formatDate } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

const STATUS_CHART_COLORS: Record<string, string> = {
  NORMAL: "#059669",
  BORDERLINE_HIGH: "#d97706",
  BORDERLINE_LOW: "#d97706",
  HIGH: "#ea580c",
  LOW: "#ea580c",
  CRITICAL_HIGH: "#e11d48",
  CRITICAL_LOW: "#e11d48",
};

function TrendChart({ trend }: { trend: TrendResponse }) {
  const dir = TREND_CONFIG[trend.trend_direction];
  const chartData = trend.points.map(p => ({
    date: formatDate(p.report_date),
    value: p.value_normalized,
    status: p.status,
  }));

  const lineColor = chartData.length > 0
    ? STATUS_CHART_COLORS[chartData[chartData.length - 1].status] || "#0284c7"
    : "#0284c7";

  const unit = trend.points[0]?.unit_normalized || "";

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{trend.canonical_name}</h3>
          <span style={{ fontSize: 13, fontWeight: 500 }} className={dir.color}>{dir.icon} {dir.label}</span>
        </div>
        <span style={{ fontSize: 12, color: "#64748b" }}>{trend.points.length} data point{trend.points.length !== 1 ? "s" : ""}</span>
      </div>

      {trend.points.length < 2 ? (
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 13 }}>
          Upload more reports to see trends
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} unit={unit ? ` ${unit.substring(0, 5)}` : ""} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              labelStyle={{ color: "#475569" }}
              itemStyle={{ color: lineColor }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Latest value */}
      {trend.points.length > 0 && (() => {
        const latest = trend.points[trend.points.length - 1];
        const cfg = STATUS_CONFIG[latest.status];
        return (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Latest: <span style={{ color: "#0f172a", fontFamily: "monospace", fontWeight: 600 }}>{latest.value_normalized} {latest.unit_normalized}</span></span>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, border: "1px solid" }} className={`${cfg.bg} ${cfg.color} ${cfg.border} badge`}>
              {cfg.label}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<AllTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function load() {
      let token: string | undefined;
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      } catch {}

      try {
        const data = await getAllTrends(token);
        setTrends(data);
      } catch {
        // Guest mode fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const trendKeys = trends ? Object.keys(trends.trends).filter(k => k.toLowerCase().includes(filter.toLowerCase())) : [];

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Biomarker Trends</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Visualize how your test results change over multiple lab reports</p>
      </div>

      {trends && Object.keys(trends.trends).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <input
            className="input-light"
            style={{ width: 280, padding: "8px 14px", fontSize: 13 }}
            placeholder="Search biomarkers…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <div className="skeleton" style={{ height: 20, width: "50%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 140 }} />
            </div>
          ))}
        </div>
      ) : !trends || Object.keys(trends.trends).length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>No trend data yet</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Upload at least two blood reports to see trends visualized over time</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {trendKeys.map(k => (
            <TrendChart key={k} trend={trends.trends[k]} />
          ))}
        </div>
      )}
    </div>
  );
}
