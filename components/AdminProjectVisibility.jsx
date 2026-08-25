'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Eye, EyeOff, Search, X } from 'lucide-react'

const TOKEN_KEY = 'portfolio_admin_token'

function SidebarVisibilityButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-slate-400 hover:text-white hover:bg-white/[.06] transition"
    >
      <span className="h-7 w-7 rounded-lg bg-white/[.05] flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></span>
      <span className="flex-1">Project Visibility</span>
      <span className="text-[9px] uppercase tracking-wider text-slate-600">Show / Hide</span>
    </button>
  )
}

export default function AdminProjectVisibility() {
  const [mounts, setMounts] = useState([])
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const syncSlots = () => {
      const targets = [...document.querySelectorAll('aside nav button')]
        .filter((b) => (b.textContent || '').includes('Featured Projects'))
      for (const target of targets) {
        if (target.nextElementSibling?.dataset?.projectVisibilitySlot === '1') continue
        const slot = document.createElement('div')
        slot.dataset.projectVisibilitySlot = '1'
        target.insertAdjacentElement('afterend', slot)
      }
      const next = [...document.querySelectorAll('[data-project-visibility-slot="1"]')]
      setMounts((prev) => (
        prev.length === next.length && prev.every((node, i) => node === next[i]) ? prev : next
      ))
    }
    syncSlots()
    const observer = new MutationObserver(syncSlots)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.querySelectorAll('[data-project-visibility-slot="1"]').forEach((el) => el.remove())
    }
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/content', { cache: 'no-store' })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || 'Unable to load projects')
      setProjects(Array.isArray(data?.projects) ? data.projects : [])
    } catch (e) {
      setError(e?.message || 'Unable to load projects')
    } finally {
      setLoading(false)
    }
  }

  const showPanel = () => {
    setOpen(true)
    load()
  }

  const setVisible = async (projectId, visible) => {
    if (busyId) return
    setBusyId(projectId)
    setError('')
    try {
      const token = localStorage.getItem(TOKEN_KEY) || ''
      const currentRes = await fetch('/api/content', { cache: 'no-store' })
      const current = await currentRes.json()
      if (!currentRes.ok) throw new Error(current?.error || 'Unable to read current content')

      const nextProjects = (current.projects || []).map((p) => p.id === projectId ? { ...p, hidden: !visible } : p)
      const nextContent = { ...current, projects: nextProjects }
      delete nextContent._warning

      const saveRes = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        },
        body: JSON.stringify(nextContent),
      })
      const saved = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) throw new Error(saved?.error || saved?.detail || 'Save failed')

      setProjects(nextProjects)
      window.dispatchEvent(new CustomEvent('portfolio-project-visibility-changed', { detail: { projectId, visible } }))
    } catch (e) {
      setError(e?.message || 'Could not update project visibility')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => `${p.title || ''} ${p.category || ''}`.toLowerCase().includes(q))
  }, [projects, query])

  const visibleCount = projects.filter((p) => !p.hidden).length

  return (
    <>
      {mounts.map((mount, i) => createPortal(<SidebarVisibilityButton key={i} onClick={showPanel} />, mount))}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[260] bg-slate-950/45 backdrop-blur-sm p-3 md:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="mx-auto max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[.18em] text-blue-600">Public portfolio controls</div>
                <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-slate-950">Project Visibility</h2>
                <p className="mt-2 text-[12px] text-slate-500">Checked = published. Unticked = completely removed from the public project catalog, card, modal and placeholder/template view.</p>
              </div>
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
            </div>

            <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="text-[11px] text-slate-500"><span className="font-semibold text-slate-900">{visibleCount}</span> published · {projects.length - visibleCount} hidden</div>
              <label className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search project or category…" className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>

            {error && <div className="mx-5 md:mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</div>}

            <div className="p-5 md:p-6 max-h-[65vh] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-[12px] text-slate-400">Loading projects…</div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((p) => {
                    const visible = !p.hidden
                    const busy = busyId === p.id
                    return (
                      <div key={p.id} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${visible ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setVisible(p.id, !visible)}
                          aria-label={visible ? `Hide ${p.title}` : `Show ${p.title}`}
                          className={`h-6 w-6 rounded-md border flex items-center justify-center shrink-0 transition ${visible ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent hover:border-blue-300'} ${busy ? 'opacity-50' : ''}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium text-slate-900 truncate">{p.title}</div>
                          <div className="mt-0.5 text-[9.5px] uppercase tracking-wider text-slate-400 truncate">{p.category}</div>
                        </div>
                        <div className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-medium ${visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {busy ? 'Saving…' : visible ? 'Published' : 'Hidden'}
                        </div>
                      </div>
                    )
                  })}
                  {!filtered.length && <div className="py-10 text-center text-[12px] text-slate-400">No matching projects.</div>}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
