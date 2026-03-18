import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Salyer Homes — Client Portal',
  description: 'Your custom home build, every step of the way.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'Jost, sans-serif', background: '#0a0a0a', color: '#f5f0e8' }}>
        {children}
      </body>
    </html>
  )
}