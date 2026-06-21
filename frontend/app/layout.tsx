import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BIDORA — Tender Intelligence Platform',
  description: 'Daily EPADS tender intelligence, personalised to your niche. AI-powered alerts, filters, and chatbot for Pakistani procurement.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%232563eb'/><text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle' font-family='Arial Black' font-weight='900' font-size='20' fill='white'>B</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0b0f1a] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}