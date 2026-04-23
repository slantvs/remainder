import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'REMAINDER',
  description: 'PROCESS_ID: unknown — EXIT CODE: pending',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
