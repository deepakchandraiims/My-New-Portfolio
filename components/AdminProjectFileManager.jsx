'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronRight, FileText, FolderOpen, Loader2, Paperclip, Trash2, Unlink, X } from 'lucide-react'

const TOKEN_KEY = 'portfolio_admin_token'

function getToken() {
  return typeof window === 'undefined' ? '' : (localStorage.getItem(TOKEN_KEY) || '')
}

function SidebarButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-slate-400 hover:text-white hover:bg-white/[.06] transition"
    >
      <span className="h-7 w-7 rounded-lg bg-white/[.05] flex items-center justify-center"><Paperclip className="h-3.5 w-3.5" /></span>
      <span className="flex-1">Project Files</span>
      <span className="text-[9px] uppercase tracking-wider text-slate-600">Remove</span>
    </button>
  )
}

export default function AdminProjectFileManager() {
  const [mounts, setMounts] = useState([])
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [files, setFiles] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const syncSlots = () => {
      const targets = [...document.querySelectorAll('aside nav button')].filter((b) => (b.textContent || '').includes('Featured Projects'))
      for (const target of targets) {
        const visibilitySlot = target.nextElementSibling?.dataset?.projectVisibilitySlot === '1' ? target.nextElementSibling : null
        const anchor = visibilitySlot || target
        if (anchor.nextElementSibling?.dataset?.projectFilesSlot === '1') continue
        const slot = document.createElement('div')
        slot.dataset.projectFilesSlot = '1'
        anchor.insertAdjacentElement('afterend', slot)
      }
      setMounts([...document.querySelectorAll('[data-project-files-slot="1"]')])
    }
    syncSlots()
    const observer = new MutationObserver(syncSlots)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.querySelectorAll('[data-project-files-slot="1"]').forEach((el) => el.remove())
    }
  }, [])

  const load = async () => {
    setLoading(true); setError(''); setStatus('')
    try {
      const [contentRes, filesRes] = await Promise.all([
        fetch('/api/content', { cache: 'no-store' }),
        fetch('/api/files', { cache: 'no-store' }),
      ])
      const content = await contentRes.json()
      const fileData = await filesRes.json()
      if (!contentRes.ok) throw new Error(content?.error || 'Could not load projects')
      if (!filesRes.ok) throw new Error(fileData?.error || 'Could not load files')
      setProjects(Array.isArray(content?.projects) ? content.projects : [])
      setFiles(Array.isArray(fileData) ? fileData : [])
    } catch (e) {
      setError(e?.message || 'Could not load project files')
    } finally {
      setLoading(false)
    }
  }

  const show = () => { setOpen(true); load() }

  const filesByProject = useMemo(() => {
    const map = new Map()
    for (const p of projects) map.set(p.id, [])
    for (const f of files) {
      if (!f?.projectId) continue
      if (String(f.label || '').startsWith('__project_thumbnail__')) continue
      if (!map.has(f.projectId)) map.set(f.projectId, [])
      map.get(f.projectId).push(f)
    }
    return map
  }, [projects, files])

  const matchingThumbs = (file) => {
    const sourceNames = new Set([file.originalName, file.label].filter(Boolean).map(String))
    return files.filter((f) => {
      if (f.projectId !== file.projectId) return false
      const label = String(f.label || '')
      if (!label.startsWith('__project_thumbnail__:')) return false
      const source = label.slice('__project_thumbnail__:'.length)
      return sourceNames.has(source)
    })
  }

  const clearCoverIfNeeded = async (projectId, removedUrls) => {
    if (!removedUrls.size) return
    const r = await fetch('/api/content', { cache: 'no-store' })
    const content = await r.json()
    if (!r.ok) throw new Error(content?.error || 'Could not read project content')
    const project = (content.projects || []).find((p) => p.id === projectId)
    if (!project || !removedUrls.has(project.coverImageUrl)) return
    const next = {
      ...content,
      projects: (content.projects || []).map((p) => p.id === projectId ? { ...p, coverImageUrl: '' } : p),
    }
    delete next._warning
    const wr = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
      body: JSON.stringify(next),
    })
    const saved = await wr.json().catch(() => ({}))
    if (!wr.ok) throw new Error(saved?.error || 'Could not clear project thumbnail')
  }

  const detach = async (file) => {
    if (busyId) return
    if (!window.confirm(`Remove “${file.label || file.originalName || 'this file'}” from this project? The file will remain in Supabase Files & Storage.`)) return
    setBusyId(file.id); setError(''); setStatus('')
    try {
      const thumbs = matchingThumbs(file)
      const removedUrls = new Set(thumbs.map((f) => f.publicUrl).filter(Boolean))
      for (const item of [file, ...thumbs]) {
        const r = await fetch(`/api/files/${encodeURIComponent(item.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
          body: JSON.stringify({ projectId: '', projectTitle: '' }),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error || `Could not detach ${item.originalName || 'file'}`)
      }
      await clearCoverIfNeeded(file.projectId, removedUrls)
      setStatus('File removed from the project. It is still available in Files & Storage.')
      await load()
    } catch (e) {
      setError(e?.message || 'Could not remove file from project')
    } finally {
      setBusyId('')
    }
  }

  const destroy = async (file) => {
    if (busyId) return
    if (!window.confirm(`Permanently delete “${file.label || file.originalName || 'this file'}” from Supabase? This cannot be undone.`)) return
    setBusyId(file.id); setError(''); setStatus('')
    try {
      const thumbs = matchingThumbs(file)
      const removedUrls = new Set([file, ...thumbs].map((f) => f.publicUrl).filter(Boolean))
      for (const item of [...thumbs, file]) {
        const r = await fetch(`/api/files/${encodeURIComponent(item.id)}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': getToken() },
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error || `Could not delete ${item.originalName || 'file'}`)
      }
      await clearCoverIfNeeded(file.projectId, removedUrls)
      setStatus('File permanently deleted from Supabase and removed from the public project.')
      await load()
    } catch (e) {
      setError(e?.message || 'Could not delete file')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      {mounts.map((mount, i) => createPortal(<SidebarButton key={i} onClick={show} />, mount))}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[270] bg-slate-950/45 backdrop-blur-sm p-3 md:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="mx-auto max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><FolderOpen className="h-5 w-5 text-blue-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[.18em] text-blue-600">Featured projects</div>
                <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-slate-950">Project File Manager</h2>
                <p className="mt-2 text-[12px] text-slate-500">Detach a file from a project while keeping it in storage, or permanently delete it from Supabase. Auto-generated thumbnails are cleaned up with the source file.</p>
              </div>
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
            </div>

            {error && <div className="mx-5 md:mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</div>}
            {status && <div className="mx-5 md:mx-6 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">{status}</div>}

            <div className="p-5 md:p-6 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="py-14 text-center text-[12px] text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading project files…</div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => {
                    const projectFiles = filesByProject.get(project.id) || []
                    const isOpen = !!expanded[project.id]
                    return (
                      <div key={project.id} className="rounded-xl border border-slate-200 overflow-hidden">
                        <button type="button" onClick={() => setExpanded((v) => ({ ...v, [project.id]: !v[project.id] }))} className="w-full px-4 py-3 flex items-center gap-3 text-left bg-white hover:bg-slate-50">
                          {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                          <div className="flex-1 min-w-0"><div className="text-[12.5px] font-medium text-slate-900 truncate">{project.title}</div><div className="mt-0.5 text-[9.5px] uppercase tracking-wider text-slate-400 truncate">{project.category}</div></div>
                          <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-medium ${projectFiles.length ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>{projectFiles.length} file{projectFiles.length === 1 ? '' : 's'}</span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50/60 p-3">
                            {projectFiles.length ? <div className="space-y-2">{projectFiles.map((file) => (
                              <div key={file.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><FileText className="h-3.5 w-3.5 text-blue-600" /></span>
                                <div className="min-w-0 flex-1"><div className="text-[11.5px] font-medium text-slate-800 truncate">{file.label || file.originalName}</div><div className="mt-0.5 text-[9px] text-slate-400 truncate">{file.originalName || file.category || 'Project file'}</div></div>
                                {file.publicUrl && <a href={file.publicUrl} target="_blank" rel="noreferrer" className="h-8 px-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-blue-600 hover:border-blue-200"><Paperclip className="h-3 w-3" /> View</a>}
                                <button disabled={!!busyId} onClick={() => detach(file)} className="h-8 px-2.5 rounded-lg border border-amber-200 bg-amber-50 flex items-center gap-1.5 text-[10px] text-amber-700 hover:bg-amber-100 disabled:opacity-40"><Unlink className="h-3 w-3" /> Detach</button>
                                <button disabled={!!busyId} onClick={() => destroy(file)} className="h-8 px-2.5 rounded-lg border border-red-200 bg-red-50 flex items-center gap-1.5 text-[10px] text-red-600 hover:bg-red-100 disabled:opacity-40">{busyId === file.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete</button>
                              </div>
                            ))}</div> : <div className="py-5 text-center text-[10.5px] text-slate-400">No files attached to this project.</div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
