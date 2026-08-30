"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, updateProfile } from "@/lib/api/client";
import type { User, Sex } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("other");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      let token: string | undefined;
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      } catch {}

      try {
        const profile = await getProfile(token);
        setUser(profile);
        setName(profile.name);
        setAge(String(profile.age));
        setSex(profile.sex);
        localStorage.setItem("bs_name", profile.name);
      } catch {
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    let token: string | undefined;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch {}

    try {
      const updated = await updateProfile({ name, age: parseInt(age), sex }, token);
      setUser(updated);
      localStorage.setItem("bs_name", updated.name);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 540 }}>
        <div className="skeleton" style={{ height: 28, width: "30%", marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 540 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Profile</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>Your age and biological sex help personalise reference ranges accurately</p>

      {success && (
        <div style={{ padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, color: "#059669", fontSize: 13, marginBottom: 20 }}>
          ✅ Profile updated successfully
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, color: "#e11d48", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        {!editing ? (
          <>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "white", fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{user?.email}</div>
              </div>
            </div>

            {[
              { label: "Full Name", value: user?.name },
              { label: "Age", value: `${user?.age} years` },
              { label: "Biological Sex", value: user?.sex, capitalize: true },
              { label: "Member Since", value: user?.created_at ? formatDate(user.created_at) : "—" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 600, textTransform: row.capitalize ? "capitalize" : undefined }}>{row.value || "—"}</span>
              </div>
            ))}

            <button className="btn-primary" onClick={() => setEditing(true)} style={{ marginTop: 24, width: "100%", justifyContent: "center" }}>
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Full Name</label>
              <input className="input-light" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Age</label>
              <input className="input-light" type="number" value={age} onChange={e => setAge(e.target.value)} min={1} max={130} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Biological Sex</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["male", "female", "other"] as Sex[]).map(s => (
                  <button type="button" key={s} onClick={() => setSex(s)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${sex === s ? "#0284c7" : "#cbd5e1"}`, background: sex === s ? "#f0f9ff" : "#ffffff", color: sex === s ? "#0284c7" : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div style={{ marginTop: 20 }} className="disclaimer-banner">
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <span>Your data is stored securely and is only accessible to you. We never sell or share your health data.</span>
      </div>
    </div>
  );
}
