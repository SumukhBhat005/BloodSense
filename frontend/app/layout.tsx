import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BioInsight — AI Blood Report Analyzer",
  description:
    "Understand your blood test results in plain English. Upload your lab report and get clear, educational explanations of your biomarkers.",
  keywords: "blood report, lab results, health analyzer, biomarker, educational",
  openGraph: {
    title: "BioInsight — AI Blood Report Analyzer",
    description: "Understand your blood test results in plain English.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-animated" suppressHydrationWarning>{children}</body>
    </html>
  );
}
