import './globals.css'
import { Providers } from './providers'
import { Inter, Instrument_Serif, Onest } from 'next/font/google'
import RuntimeEnhancements from '@/components/RuntimeEnhancements'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const onest = Onest({
  subsets: ['latin'],
  variable: '--font-onest',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
})

export const metadata = {
  title: 'Deepak Chandra — Strategic Finance, M&A & Private Markets',
  description: 'Finance portfolio spanning M&A, strategic finance, private markets, special situations, modelling, research and investment casework.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${onest.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="font-sans antialiased bg-white text-slate-900 selection:bg-blue-500/20 selection:text-blue-950">
        <Providers>
          {children}
          <RuntimeEnhancements />
        </Providers>
      </body>
    </html>
  )
}
