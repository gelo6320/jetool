import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jew Detector',
  description: 'AI-powered Jews Detection tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Background Image */}
        <img src="/assets/sta.png" alt="Background" className="background-image" />
        {/* Money Image */}
        <img src="/assets/moneyj.webp" alt="Money" className="money-image" />
        {/* Ben Image */}
        <img src="/assets/ben.avif" alt="Ben" className="ben-image" />
        {children}
      </body>
    </html>
  )
}