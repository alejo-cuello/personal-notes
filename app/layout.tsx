import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Quiet — Notes, To-dos & Your AI Companion",
  description:
    "A calm personal space for your notes and to-do list, with an AI companion that talks with you about what's on your mind and what's due.",
}

export const viewport: Viewport = {
  themeColor: "#f9f7f2",
  colorScheme: "light dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
