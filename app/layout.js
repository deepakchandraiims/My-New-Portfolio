import './globals.css'
import { Providers } from './providers'
import { Inter, Instrument_Serif } from 'next/font/google'
import MarketEnhancements from '@/components/MarketEnhancements'
import PortfolioEnhancements from '@/components/PortfolioEnhancements'
import DirectSupabaseUploadBridge from '@/components/DirectSupabaseUploadBridge'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
})

export const metadata = {
  title: 'Deepak — Investment Banking, Strategic Finance & M&A',
  description: 'Institutional-grade financial intelligence — DCF, LBO, M&A execution, corporate development, and AI-augmented deal workflows. Case studies, selected transactions, and downloadable analytics artefacts.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="font-sans antialiased bg-white text-slate-900 selection:bg-blue-500/20 selection:text-blue-950">
        <Providers>
          <DirectSupabaseUploadBridge />
          {children}
          <MarketEnhancements />
          <PortfolioEnhancements />
        </Providers>
      </body>
    </html>
  )
}
