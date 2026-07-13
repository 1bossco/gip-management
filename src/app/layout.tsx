import type { Metadata, Viewport } from "next";
import { Noto_Serif, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell }     from "@/components/layout/AppShell";
import "./globals.css";

// ── Typography ─────────────────────────────────────────────────
// DM Sans: clean, professional body text — not Inter/Roboto
// Noto Serif: authority weight for display numbers and headings

const dmSans = DM_Sans({
  subsets:  ["latin"],
  variable: "--font-body",
  display:  "swap",
  weight:   ["400", "500", "600", "700", "800"],
});

const notoSerif = Noto_Serif({
  subsets:  ["latin"],
  variable: "--font-display",
  display:  "swap",
  weight:   ["400", "700"],
});

// ── Metadata ───────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default:  "GIP Management System",
    template: "%s · GIP System",
  },
  description:
    "Government Internship Program — Applicant Registration and Monitoring System",
  robots: "noindex, nofollow", // internal government system
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
};

// ── Root Layout ────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${notoSerif.variable}`}>
      <body className="font-body antialiased bg-[#f7f8fc] text-[#1a1a2e]">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
