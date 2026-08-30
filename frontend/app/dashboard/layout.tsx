"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard/upload", label: "Analyze Report", icon: "🔬" },
  { href: "/dashboard", label: "Recent Reports", icon: "📋" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        boxShadow: "1px 0 3px 0 rgba(0, 0, 0, 0.02)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 24px", marginBottom: 36, textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>BloodSense</span>
        </Link>

        <nav style={{ flex: 1, padding: "0 14px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "#0284c7" : "#475569",
                background: active ? "#f0f9ff" : "transparent",
                border: `1px solid ${active ? "#bae6fd" : "transparent"}`,
                transition: "all 0.15s ease",
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
          <span>🩸 BloodSense Medical Literacy Tool</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: "36px 40px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
