import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BloodSense — AI Blood Report Analyzer | Understand Lab Results in Plain English",
  description:
    "Upload your blood test report (PDF or image) and get instant, AI-powered analysis. BloodSense classifies 80+ biomarkers, explains results in plain English, and tracks health trends over time. Free and educational.",
  keywords: [
    "blood report analyzer",
    "blood test analyzer",
    "AI blood report",
    "lab report analyzer",
    "blood test results",
    "biomarker analysis",
    "CBC analyzer",
    "health report AI",
    "blood report reader",
    "understand blood test",
    "medical report analyzer",
    "blood test explanation",
    "lab results explained",
    "health literacy tool",
  ],
  authors: [{ name: "BloodSense" }],
  creator: "BloodSense",
  publisher: "BloodSense",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "BloodSense — AI Blood Report Analyzer",
    description:
      "Upload your blood test report and get instant, plain-English explanations of every biomarker. Free, secure, and educational.",
    type: "website",
    locale: "en_US",
    siteName: "BloodSense",
  },
  twitter: {
    card: "summary_large_image",
    title: "BloodSense — AI Blood Report Analyzer",
    description:
      "Upload your lab report and understand your blood test results in plain English. Powered by Google Gemini AI.",
  },
  category: "Health",
};

// JSON-LD structured data for Google rich results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BloodSense",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "AI-powered blood report analyzer that extracts biomarkers from lab reports and explains results in plain English.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Upload PDF or image blood test reports",
    "Automatic biomarker extraction using AI",
    "Deterministic classification (Normal, Borderline, High, Critical)",
    "Plain-English explanations of lab results",
    "Historical health trend tracking",
    "Support for 80+ biomarkers including CBC, LFT, RFT, Lipid Profile",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0284c7" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-animated" suppressHydrationWarning>{children}</body>
    </html>
  );
}
