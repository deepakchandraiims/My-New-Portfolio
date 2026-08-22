'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

function initials(name = '') {
  return String(name).split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 3).join('').toUpperCase() || '•'
}

function ToolCard({ tool }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 hover:border-blue-200 hover:shadow-sm transition min-w-0">
      <div className="h-10 flex items-center justify-center">
        {tool.logoUrl ? (
          <img src={tool.logoUrl} alt={`${tool.name} logo`} loading="lazy" className="max-h-9 max-w-[92px] object-contain" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700">{initials(tool.name)}</div>
        )}
      </div>
      <div className="mt-2 text-[10.5px] font-semibold text-slate-800 leading-tight text-center line-clamp-2">{tool.name}</div>
      <div className="mt-1 text-[8.5px] uppercase tracking-[.08em] text-slate-400 text-center line-clamp-1">{tool.category}</div>
    </div>
  )
}

export default function ToolLogoEnhancer() {
  const [mount, setMount] = useState(null)
  const [tools, setTools] = useState([])

  useEffect(() => {
    let cancelled = false
    const section = document.getElementById('skills-tools')
    if (!section) return
    const cards = section.querySelectorAll('.rb-card')
    const host = cards?.[1]
    if (!host) return

    host.classList.add('tool-catalog-active')
    const node = document.createElement('div')
    node.className = 'tool-logo-root'
    host.appendChild(node)
    setMount(node)

    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return
        const catalog = Array.isArray(data?.toolCatalog) ? data.toolCatalog : []
        setTools(catalog)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      host.classList.remove('tool-catalog-active')
      node.remove()
    }
  }, [])

  if (!mount) return null
  return createPortal(
    <>
      <style jsx global>{`
        .tool-catalog-active > *:not(.tool-logo-root){display:none!important}
        .tool-catalog-active{padding:1.25rem!important}
      `}</style>
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[.15em] text-blue-700">Tools & platforms</div>
          <div className="text-[9px] text-slate-400">Supabase-hosted assets</div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
          {tools.map((tool) => <ToolCard key={tool.name} tool={tool} />)}
        </div>
        {tools.length === 0 && <div className="mt-4 text-[11px] text-slate-400">Tool logos are syncing…</div>}
      </div>
    </>,
    mount,
  )
}
