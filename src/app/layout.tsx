import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/app-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ThriftIQ',
  description: 'AI-assisted resale sourcing and inventory platform.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  )
}
