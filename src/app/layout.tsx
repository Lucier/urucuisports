import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'https://urucuisportes.com').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Urucuí Esportes',
    default: 'Urucuí Esportes',
  },
  description: 'Seu portal de notícias, resultados e classificações esportivas.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Urucuí Esportes',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Urucuí Esportes' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@urucuisportes',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-slate-50 antialiased`}
      >
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Navbar />
        <main id="conteudo-principal" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
