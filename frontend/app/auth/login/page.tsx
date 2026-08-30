"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.5px" }}>BloodSense</span>
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8edf5", marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: "#8892a4", fontSize: 14 }}>Sign in to view your reports</p>
        </div>

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Email</label>
              <input className="input-dark" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8892a4", marginBottom: 8 }}>Password</label>
              <input className="input-dark" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>
            )}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#8892a4" }}>
            No account?{" "}
            <Link href="/auth/signup" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
