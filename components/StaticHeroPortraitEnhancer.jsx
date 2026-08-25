'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { BriefcaseBusiness, MapPin } from 'lucide-react'

const FALLBACK_PORTRAIT = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwxfHxidXNpbmVzc21hbiUyMHN1aXR8ZW58MHx8fGJsYWNrfDE3ODQwMTMxMjR8MA&ixlib=rb-4.1.0&q=85&w=900'

export default function StaticHeroPortraitEnhancer() {
  const [mount, setMount] = useState(null)
  const [owner, setOwner] = useState(null)

  useEffect(() => {
    let slot = null
    let cancelled = false
    let observer = null

    const install = () => {
      const top = document.getElementById('top')
      if (!top) return false
      const grid = [...top.children].find((el) => el.classList?.contains('grid'))
      const host = grid?.lastElementChild
      if (!host || host.dataset.staticPortraitReady === '1') return !!host

      host.dataset.staticPortraitReady = '1'
      host.classList.add('static-hero-photo-host')
      slot = document.createElement('div')
      slot.className = 'static-hero-photo-root'
      host.appendChild(slot)
      setMount(slot)
      return true
    }

    if (!install()) {
      observer = new MutationObserver(() => {
        if (install()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled) setOwner(data?.owner || null) })
      .catch(() => {})

    return () => {
      cancelled = true
      observer?.disconnect()
      if (slot?.parentElement) {
        const host = slot.parentElement
        slot.remove()
        host.classList.remove('static-hero-photo-host')
        delete host.dataset.staticPortraitReady
      }
    }
  }, [])

  if (!mount) return null

  const portrait = owner?.portraitUrl || FALLBACK_PORTRAIT
  const focalX = owner?.portraitFocal?.x ?? 50
  const focalY = owner?.portraitFocal?.y ?? 30

  return createPortal(
    <>
      <style jsx global>{`
        .static-hero-photo-host > *:not(.static-hero-photo-root) { display: none !important; }
        .static-hero-photo-host { min-height: 520px; display: flex; align-items: center; justify-content: center; }
        .static-hero-photo-root { width: 100%; }
        @media (max-width: 1023px) { .static-hero-photo-host { min-height: 440px; } }
      `}</style>
      <div className="mx-auto w-full max-w-[500px] px-2 lg:px-0">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_30px_80px_-42px_rgba(15,23,42,.55)] aspect-[4/5]">
          <img
            src={portrait}
            alt={owner?.name || 'Professional portrait'}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950/72 via-slate-950/20 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/20 bg-white/90 backdrop-blur-md px-4 py-3 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-slate-900 truncate">{owner?.currentRole || owner?.role || 'Strategic Finance & M&A'}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <span className="truncate">{owner?.location || 'India'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-blue-600/80" />
      </div>
    </>,
    mount,
  )
}
