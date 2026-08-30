"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const FEATURES = [
  { icon: "🔬", title: "Smart Extraction", desc: "Gemini Vision reads your lab report — PDFs, photos, scans. No manual entry." },
  { icon: "📊", title: "Instant Analysis", desc: "80+ biomarkers classified as Normal, Borderline, High, or Critical — deterministically." },
  { icon: "💬", title: "Plain English", desc: "AI explains what your results mean in simple language anyone can understand." },
  { icon: "📈", title: "Track Trends", desc: "Upload multiple reports and visualize how your health changes over time." },
  { icon: "🔒", title: "Private & Confidential", desc: "Your report data is processed securely for your session. Never shared or sold." },
  { icon: "⚕️", title: "Doctor-Ready", desc: "Know which actionable questions to ask at your next appointment." },
];

const BIOMARKER_DEMO = [
  { name: "HbA1c", value: "5.4%", status: "NORMAL", label: "Normal ✓", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { name: "LDL Cholesterol", value: "142 mg/dL", status: "HIGH", label: "High ↑", cls: "text-orange-700 bg-orange-50 border-orange-200" },
  { name: "Vitamin D", value: "18 ng/mL", status: "LOW", label: "Low ↓", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  { name: "TSH", value: "2.1 mIU/L", status: "NORMAL", label: "Normal ✓", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { name: "Triglycerides", value: "198 mg/dL", status: "BORDERLINE_HIGH", label: "Borderline ↑", cls: "text-amber-700 bg-amber-50 border-amber-200" },
];

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc", color: "#0f172a" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid #e2e8f0",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0284c7", letterSpacing: "-0.5px" }}>BloodSense</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/dashboard/upload" style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "white", fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 8px rgba(2,132,199,0.2)" }}>
              Analyze Report Now →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 1200,
        margin: "40px auto 60px",
        padding: "80px 24px",
        textAlign: "center",
        position: "relative",
        background: "#0f172a",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3)"
      }}>
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "translate(-50%, -50%)",
            opacity: 0.45,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        {/* Radial Dark Overlay to guarantee high text contrast */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at center, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }} />

        <div style={{
          position: "relative",
          zIndex: 2,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s ease",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: "1px solid rgba(2, 132, 199, 0.3)", background: "rgba(2, 132, 199, 0.1)", marginBottom: 28, fontSize: 13, color: "#38bdf8", fontWeight: 600 }}>
            <span>✨</span> No registration needed — instant analysis per session
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 24, color: "#ffffff", letterSpacing: "-0.5px" }}>
            Understand Your{" "}
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #0d9488, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Blood Report
            </span>
            <br />In Plain English
          </h1>
          <p style={{ fontSize: 19, color: "#94a3b8", maxWidth: 620, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Upload your lab report, enter patient details, and get clear explanations of every biomarker instantly.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard/upload" style={{ padding: "16px 40px", borderRadius: 12, background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "white", fontSize: 18, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 24px rgba(2,132,199,0.3)" }}>
              Analyze My Report Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Demo preview */}
      <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.07)" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 600, color: "#475569" }}>Sample Lab Report Analysis</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", fontSize: 11, color: "#64748b", letterSpacing: "0.05em" }}>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>Test Name</th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>Result</th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {BIOMARKER_DEMO.map((b, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 24px", fontWeight: 600, color: "#0f172a" }}>{b.name}</td>
                  <td style={{ padding: "14px 24px", fontFamily: "monospace", color: "#334155" }}>{b.value}</td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: "1px solid" }} className={b.cls}>
                      {b.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 48, color: "#0f172a" }}>
          Everything You Need to Understand Your Health
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card card-hover" style={{ padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff", padding: "40px 24px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
        <p style={{ marginBottom: 8 }}>🩸 BloodSense — Health Literacy Assistant</p>
        <p>For educational purposes only. Always consult your doctor for medical advice.</p>
      </footer>
    </div>
  );
}
