"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadReport } from "@/lib/api/client";

const STEPS = ["Patient Details & File", "Upload", "Processing", "Done"];
const MAX_SIZE_MB = 10;

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Per-session patient demographics
  const [age, setAge] = useState<number>(30);
  const [sex, setSex] = useState<"male" | "female" | "other">("male");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");

  // Load cached demographics from localStorage
  useEffect(() => {
    const savedAge = localStorage.getItem("bs_demo_age");
    const savedSex = localStorage.getItem("bs_demo_sex");
    const savedWeight = localStorage.getItem("bs_demo_weight");
    const savedHeight = localStorage.getItem("bs_demo_height");
    if (savedAge) setAge(parseInt(savedAge) || 30);
    if (savedSex) setSex((savedSex as any) || "male");
    if (savedWeight) setWeight(savedWeight);
    if (savedHeight) setHeight(savedHeight);
  }, []);

  const handleFile = useCallback((f: File) => {
    setError("");
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(f.type)) {
      setError("Only PDF, JPG, and PNG files are supported.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select or drop a medical report file.");
      return;
    }
    if (!age || age < 1 || age > 120) {
      setError("Please enter a valid patient age (1–120 years).");
      return;
    }

    // Save demographics in localStorage for next time
    localStorage.setItem("bs_demo_age", String(age));
    localStorage.setItem("bs_demo_sex", sex);
    if (weight) localStorage.setItem("bs_demo_weight", weight);
    if (height) localStorage.setItem("bs_demo_height", height);

    setUploading(true);
    setError("");
    setStep(1);

    try {
      setStep(2);
      const result = await uploadReport(file, {
        age,
        sex,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
      });
      setStep(3);

      // Redirect to report detail page
      setTimeout(() => router.push(`/dashboard/reports/${result.report_id}`), 1500);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "Upload failed. Please try again.";
      setError(msg);
      setStep(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Analyze Report</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Enter patient details and upload your lab report — no sign-in required</p>
      </div>

      {/* Step progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                background: i < step ? "#059669" : i === step ? "#0284c7" : "#e2e8f0",
                color: i <= step ? "white" : "#64748b",
                border: `2px solid ${i <= step ? (i < step ? "#059669" : "#0284c7") : "#cbd5e1"}`,
                transition: "all 0.3s",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === step ? "#0284c7" : "#64748b", fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 12px", background: i < step ? "#059669" : "#e2e8f0", transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {step === 3 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Report Uploaded!</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Analyzing your biomarkers… Redirecting to results page.</p>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #0284c7", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
      ) : (
        <>
          {/* Patient Details Form Card */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>👤 Patient Details (For Accurate Normal Ranges)</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Reference ranges for Hemoglobin, ESR, Sugar, and Creatinine adjust based on age & sex</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Age <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  type="number"
                  className="input-light"
                  value={age}
                  onChange={e => setAge(parseInt(e.target.value) || 0)}
                  min={1}
                  max={120}
                  placeholder="e.g. 45"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Biological Sex <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["male", "female", "other"] as const).map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSex(s)}
                      style={{
                        flex: 1,
                        padding: "9px 6px",
                        borderRadius: 8,
                        border: `1px solid ${sex === s ? "#0284c7" : "#cbd5e1"}`,
                        background: sex === s ? "#f0f9ff" : "#ffffff",
                        color: sex === s ? "#0284c7" : "#475569",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Weight (kg) <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="number"
                  className="input-light"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 70"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Height (cm) <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="number"
                  className="input-light"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="e.g. 175"
                />
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#0284c7" : file ? "#059669" : "#cbd5e1"}`,
              borderRadius: 20,
              padding: 40,
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "#f0f9ff" : file ? "#ecfdf5" : "#ffffff",
              transition: "all 0.2s ease",
              marginBottom: 24,
              boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)"
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <>
                <div style={{ fontSize: 44, marginBottom: 12 }}>{file.type === "application/pdf" ? "📄" : "🖼️"}</div>
                <div style={{ fontWeight: 600, color: "#059669", marginBottom: 4, fontSize: 15 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{(file.size / 1024 / 1024).toFixed(2)} MB — Click to change file</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📂</div>
                <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6, fontSize: 16 }}>Drop your medical report PDF or image here</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>or click to browse from your device</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {["PDF", "JPG", "PNG"].map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 6, background: "#f1f5f9", color: "#475569", fontSize: 12, border: "1px solid #e2e8f0", fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, color: "#be123c", fontSize: 13, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn-primary"
              disabled={!file || uploading}
              onClick={handleUpload}
              style={{ flex: 1, justifyContent: "center", padding: "14px", fontSize: 16 }}
            >
              {uploading ? "Analyzing Report…" : "Analyze Report →"}
            </button>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12, color: "#b45309", lineHeight: 1.6 }}>
        ⚕️ This tool is for educational purposes only. Results are not medical advice.
      </div>
    </div>
  );
}
