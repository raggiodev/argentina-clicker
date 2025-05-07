import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Argentina Clicker | raggiodev',
  description: 'Argentina Clicker - Juego web idle estimulación argentino',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
