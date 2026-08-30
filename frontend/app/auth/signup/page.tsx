"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/lib/api/client";
import type { Sex } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("other");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: signupErr } = await supabase.auth.signUp({ email, password });
    if (signupErr) { setError(signupErr.message); setLoading(false); return; }
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) await createProfile({ name, age: parseInt(age), sex }, token);
    } catch (profileErr) { console.warn("Profile creation will retry on next login"); }
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.5px" }}>BloodSense</span>
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8edf5", marginBottom: 8 }}>{step === 1 ? "Create your account" : "Tell us about yourself"}</h1>
          <p style={{ color: "#8892a4", fontSize: 14 }}>{step === 1 ? "Free forever. No credit card required." : "Used to personalise your reference ranges."}</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? "#3b82f6" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {step === 1 ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Email</label>
                  <input className="input-dark" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Password</label>
                  <input className="input-dark" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Full name</label>
                  <input className="input-dark" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Age</label>
                  <input className="input-dark" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Your age" min={1} max={130} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Biological sex <span style={{ color: "#4a5568" }}>(for reference ranges)</span></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["male", "female", "other"] as Sex[]).map(s => (
                      <button type="button" key={s} onClick={() => setSex(s)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${sex === s ? "#3b82f6" : "rgba(255,255,255,0.08)"}`, background: sex === s ? "rgba(59,130,246,0.15)" : "transparent", color: sex === s ? "#60a5fa" : "#8892a4", fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>
            )}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              {loading ? "Creating account…" : step === 1 ? "Continue →" : "Create Account →"}
            </button>
          </form>
          {step === 1 && (
            <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#8892a4" }}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
