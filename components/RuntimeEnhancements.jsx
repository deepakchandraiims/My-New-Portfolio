'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const MarketEnhancements = dynamic(() => import('@/components/MarketEnhancements'), { ssr: false })
const PortfolioEnhancements = dynamic(() => import('@/components/PortfolioEnhancements'), { ssr: false })
const DirectSupabaseUploadBridge = dynamic(() => import('@/components/DirectSupabaseUploadBridge'), { ssr: false })

export default function RuntimeEnhancements() {
  const pathname = usePathname()
  const [idleReady, setIdleReady] = useState(false)
  const isAdmin = pathname?.startsWith('/admin')

  useEffect(() => {
    if (isAdmin) {
      setIdleReady(false)
      return
    }

    let timer
    let idleId
    const activate = () => setIdleReady(true)

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(activate, { timeout: 1200 })
    } else {
      timer = window.setTimeout(activate, 700)
    }

    return () => {
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
      if (timer) window.clearTimeout(timer)
    }
  }, [isAdmin])

  if (isAdmin) return <DirectSupabaseUploadBridge />
  if (!idleReady) return null

  return (
    <>
      <MarketEnhancements />
      <PortfolioEnhancements />
    </>
  )
}
