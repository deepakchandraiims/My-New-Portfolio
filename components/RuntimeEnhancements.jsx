'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const MarketEnhancements = dynamic(() => import('@/components/MarketEnhancements'), { ssr: false })
const PortfolioEnhancements = dynamic(() => import('@/components/PortfolioEnhancements'), { ssr: false })
const PortfolioReferenceSections = dynamic(() => import('@/components/PortfolioReferenceSections'), { ssr: false })
const DirectSupabaseUploadBridge = dynamic(() => import('@/components/DirectSupabaseUploadBridge'), { ssr: false })
const AdminWorkflowEnhancements = dynamic(() => import('@/components/AdminWorkflowEnhancements'), { ssr: false })

export default function RuntimeEnhancements() {
  const pathname = usePathname()
  const [idleReady, setIdleReady] = useState(false)
  const isAdmin = pathname?.startsWith('/admin')

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    document.body.classList.toggle('portfolio-public-smooth', !isAdmin)
    return () => document.body.classList.remove('portfolio-public-smooth')
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      setIdleReady(false)
      return
    }

    let timer
    let idleId
    const activate = () => setIdleReady(true)

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(activate, { timeout: 900 })
    } else {
      timer = window.setTimeout(activate, 500)
    }

    return () => {
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
      if (timer) window.clearTimeout(timer)
    }
  }, [isAdmin])

  return (
    <>
      <style jsx global>{`
        body.portfolio-public-smooth {
          overscroll-behavior-y: none;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        /* The previous content-visibility optimisation improved first paint but
           could change intrinsic section heights during scrolling. Keep the
           deferred JS chunks, but make document geometry stable for smooth
           recruiter-style scrolling. */
        body.portfolio-public-smooth main > section:not(#top),
        body.portfolio-public-smooth main > footer {
          content-visibility: visible !important;
          contain-intrinsic-size: none !important;
        }

        body.portfolio-public-smooth main > section:not(#top) .glass-strong {
          backdrop-filter: blur(12px) saturate(1.18);
          -webkit-backdrop-filter: blur(12px) saturate(1.18);
        }

        body.portfolio-public-smooth #work,
        body.portfolio-public-smooth #transactions,
        body.portfolio-public-smooth #experience,
        body.portfolio-public-smooth #lab {
          scroll-margin-top: 78px;
        }

        body.portfolio-public-smooth .reference-panel {
          border: 1px solid rgb(226 232 240);
          background: rgba(255,255,255,.96);
          border-radius: 1rem;
          box-shadow: 0 16px 40px -34px rgba(15,23,42,.45);
        }

        body.portfolio-public-smooth .reference-portfolio-sections {
          position: relative;
          isolation: isolate;
        }

        body.portfolio-public-smooth .reference-portfolio-sections > section {
          position: relative;
        }

        body.portfolio-public-smooth .reference-portfolio-sections > section::before {
          content: '';
          position: absolute;
          inset: 18% 6% auto;
          height: 220px;
          background: radial-gradient(circle at center, rgba(37,99,235,.055), transparent 68%);
          pointer-events: none;
          z-index: -1;
        }

        @media (max-width: 768px) {
          body.portfolio-public-smooth .reference-portfolio-sections > section {
            padding-top: 3.5rem;
            padding-bottom: 3.5rem;
          }
        }
      `}</style>

      {isAdmin ? (
        <>
          <DirectSupabaseUploadBridge />
          <AdminWorkflowEnhancements />
        </>
      ) : idleReady ? (
        <>
          <MarketEnhancements />
          <PortfolioEnhancements />
          <PortfolioReferenceSections />
        </>
      ) : null}
    </>
  )
}
