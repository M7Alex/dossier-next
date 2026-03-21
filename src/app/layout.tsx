import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dossier Confidentiel — Dept. Finances LS',
  description: 'Dossier de candidature interactif',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" href="/legacy_theme.mp3" as="audio" type="audio/mpeg"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
