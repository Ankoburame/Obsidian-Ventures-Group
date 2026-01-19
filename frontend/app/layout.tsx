import "./globals.css"
import { AppShell } from "@/components/layout/AppShell"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Obsidian Ventures Group | Resource Management",
  description: "Precision. Power. Profit. - Multi-sector industrial operations across Stanton, Nyx, and Pyro systems.",
  keywords: ["Star Citizen", "OVG", "Obsidian Ventures Group", "Mining", "Refining", "Trading", "Economy"],
  authors: [{ name: "Obsidian Ventures Group" }],
  icons: {
    icon: [
      { url: "/images/logo/ovg_icon_only.svg", type: "image/svg+xml" },
    ],
    shortcut: "/images/logo/ovg_icon_only.svg",
    apple: "/images/logo/ovg_icon_only.svg",
  },
  openGraph: {
    title: "Obsidian Ventures Group",
    description: "Precision. Power. Profit.",
    type: "website",
    siteName: "OVG Resource Management",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      <head>
        <link rel="icon" href="/images/logo/ovg_icon_only.svg" type="image/svg+xml" />
      </head>
      <body style={{ overflowX: 'hidden', maxWidth: '100vw', margin: 0 }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}