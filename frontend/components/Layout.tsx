import "./globals.css"
import { AppShell } from "@/components/layout/AppShell"
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const NotificationsProvider = dynamic(
  () => import('@/contexts/NotificationsContext').then(mod => ({ default: mod.NotificationsProvider })),
  { ssr: false }
)

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
    <html lang="fr">
      <head>
        <link rel="icon" href="/images/logo/ovg_icon_only.svg" type="image/svg+xml" />
      </head>
      <body>
        <NotificationsProvider>
          <AppShell>{children}</AppShell>
        </NotificationsProvider>
      </body>
    </html>
  )
}