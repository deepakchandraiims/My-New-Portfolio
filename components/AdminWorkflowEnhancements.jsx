'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check, ChevronRight, FileText, FolderOpen, Loader2, Paperclip, Plus,
  Save, SlidersHorizontal, Upload, Wrench, X,
} from 'lucide-react'

const TOKEN_KEY = 'portfolio_admin_token'
const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function Drawer({ open, title, subtitle, icon: Icon, onClose, children }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[140] bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-y-0 right-0 w-full max-w-[620px] bg-[#f8fafc] shadow-2xl border-l border-slate-200 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 md:px-6 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><Icon className="h-4.5 w-4.5 text-blue-600" /></div>
          <div className="flex-1 min-w-0"><h2 className="text-[18px] font-semibold text-slate-950">{title}</h2><p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p></div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function SidebarAction({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-slate-300 hover:bg-white/[.06] hover:text-white transition">
      <Icon className="h-4 w-4 shrink-0" /><span className="flex-1 truncate">{label}</span><ChevronRight className="h-3.5 w-3.5 text-slate-600" />
    </button>
  )
}

function csvToArray(value) {
  return String(value || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean)
}

function SkillsToolsDrawer({ open, onClose }) {
  const [content, setContent] = useState(null)
  const [finance, setFinance] = useState('')
  const [tools, setTools] = useState('')
  const [expertise, setExpertise] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setStatus('')
    const r = await fetch('/api/content')
    const d = await r.json()
    setContent(d)
    const groups = d?.skills || []
    const financeGroup = groups.find((g) => /finance|valuation/i.test(g.group || '')) || groups[0]
    const toolsGroup = groups.find((g) => /data|engineering|tool/i.test(g.group || ''))
    const fallbackTools = (d?.projects || []).flatMap((p) => p.tools || [])
    setFinance((financeGroup?.items || []).join(', '))
    setTools((d?.tools?.length ? d.tools : (toolsGroup?.items?.length ? toolsGroup.items : [...new Set(fallbackTools)])).join(', '))
    setExpertise((d?.expertise || []).join(', '))
  }, [])

  useEffect(() => { if (open) load().catch(() => setStatus('Could not load content.')) }, [open, load])

  const save = async () => {
    if (!content) return
    setSaving(true); setStatus('')
    try {
      const financeItems = csvToArray(finance)
      const toolItems = csvToArray(tools)
      const expertiseItems = csvToArray(expertise)
      const groups = [...(content.skills || [])]
      const fi = groups.findIndex((g) => /finance|valuation/i.test(g.group || ''))
      if (fi >= 0) groups[fi] = { ...groups[fi], items: financeItems }
      else groups.unshift({ group: 'Finance & Valuation', items: financeItems })
      const ti = groups.findIndex((g) => /data|engineering|tool/i.test(g.group || ''))
      if (ti >= 0) groups[ti] = { ...groups[ti], group: groups[ti].group || 'Tools & Platforms', items: toolItems }
      else groups.push({ group: 'Tools & Platforms', items: toolItems })

      const next = { ...content, skills: groups, tools: toolItems, expertise: expertiseItems }
      const token = localStorage.getItem(TOKEN_KEY) || ''
      const r = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(next),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
      setContent(next)
      setStatus('Saved. The public Skills & Tools section will update automatically.')
    } catch (e) { setStatus(e.message || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Skills & Tools" subtitle="Control the recruiter-facing finance skills, platforms and expertise panels." icon={Wrench}>
      {!content ? <div className="py-12 text-center text-[12px] text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</div> : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] uppercase tracking-[.15em] text-blue-600 font-medium">Financial skills</div>
            <p className="mt-1 text-[11px] text-slate-400">Comma-separated. These appear in the left panel of Skills & Tools.</p>
            <textarea rows={5} value={finance} onChange={(e) => setFinance(e.target.value)} className={`${inputCls} mt-3 resize-y`} placeholder="Financial Modeling, DCF, LBO, M&A…" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] uppercase tracking-[.15em] text-blue-600 font-medium">Tools & platforms</div>
            <p className="mt-1 text-[11px] text-slate-400">Excel, Power BI, SQL, Python, Capital IQ, Bloomberg, VBA, Tableau, etc.</p>
            <textarea rows={5} value={tools} onChange={(e) => setTools(e.target.value)} className={`${inputCls} mt-3 resize-y`} placeholder="Excel, Power BI, SQL, Python…" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] uppercase tracking-[.15em] text-blue-600 font-medium">Expertise areas</div>
            <p className="mt-1 text-[11px] text-slate-400">Short recruiter keywords shown as compact capability chips.</p>
            <textarea rows={4} value={expertise} onChange={(e) => setExpertise(e.target.value)} className={`${inputCls} mt-3 resize-y`} placeholder="3 Statement Modeling, DCF & Valuation, LBO Modeling…" />
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-[11.5px] leading-relaxed text-slate-600">
            Project-specific tools are still editable inside each Featured Project under its existing <strong className="text-slate-800">Tools</strong> field. This panel controls the portfolio-wide Tools & Platforms showcase.
          </div>
          {status && <div className={`rounded-lg px-3 py-2 text-[11.5px] ${/saved/i.test(status) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{status}</div>}
          <button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12.5px] font-medium flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Skills & Tools
          </button>
        </div>
      )}
    </Drawer>
  )
}

function ProjectFilesDrawer({ open, onClose }) {
  const [projects, setProjects] = useState([])
  const [files, setFiles] = useState([])
  const [projectId, setProjectId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    const [c, f] = await Promise.all([
      fetch('/api/content').then((r) => r.json()),
      fetch('/api/files').then((r) => r.json()),
    ])
    setProjects((c?.projects || []).filter((p) => !p.hidden).map((p) => ({ id: p.id, title: p.title })))
    setFiles(Array.isArray(f) ? f : [])
  }, [])

  useEffect(() => { if (open) load().catch(() => setStatus('Could not load files.')) }, [open, load])

  const assign = async (file, nextId) => {
    const token = localStorage.getItem(TOKEN_KEY) || ''
    const project = projects.find((p) => p.id === nextId)
    const r = await fetch(`/api/files/${encodeURIComponent(file.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ projectId: nextId || null, projectTitle: project?.title || null }),
    })
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
    setFiles((prev) => prev.map((x) => x.id === file.id ? { ...x, projectId: nextId || null, projectTitle: project?.title || null } : x))
  }

  const upload = (file) => new Promise((resolve, reject) => {
    const token = localStorage.getItem(TOKEN_KEY) || ''
    const project = projects.find((p) => p.id === projectId)
    const form = new FormData()
    form.append('file', file)
    if (projectId) {
      form.append('projectId', projectId)
      form.append('projectTitle', project?.title || '')
    }
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/files/upload')
    xhr.setRequestHeader('x-admin-token', token)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          const added = data.file || data
          setFiles((prev) => [added, ...prev.filter((x) => x.id !== added.id)])
          resolve(added)
        } catch (e) { reject(e) }
      } else reject(new Error(`HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(form)
  })

  const onFiles = async (selected) => {
    const list = Array.from(selected || [])
    if (!list.length) return
    setUploading(true); setStatus('')
    try {
      for (const f of list) await upload(f)
      setStatus(`${list.length} file${list.length === 1 ? '' : 's'} uploaded${projectId ? ' and attached to the selected project' : ''}.`)
    } catch (e) { setStatus(e.message || 'Upload failed') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Project Files" subtitle="Upload directly to a Featured Project or reassign any existing file after upload." icon={FolderOpen}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-[11px] uppercase tracking-[.15em] text-blue-600 font-medium">Upload & attach</div>
          <p className="mt-1 text-[11px] text-slate-400">Choose the destination project first. The file will be linked to that project immediately.</p>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${inputCls} mt-3`}>
            <option value="">— Upload as unassigned —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.md,.zip,.py,.sql,.txt,image/*,video/*" />
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-3 w-full h-11 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-[12px] font-medium flex items-center justify-center gap-2 transition">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? 'Uploading…' : 'Choose files to upload'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div><div className="text-[11px] uppercase tracking-[.15em] text-slate-500 font-medium">Uploaded files</div><div className="mt-1 text-[10.5px] text-slate-400">Change the project at any time. No re-upload needed.</div></div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500">{files.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
            {files.length === 0 && <div className="p-6 text-center text-[12px] text-slate-400">No uploaded files yet.</div>}
            {files.map((file) => (
              <div key={file.id} className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-slate-800 truncate">{file.label || file.originalName}</div>
                  <div className="mt-0.5 text-[10.5px] text-slate-400 truncate">{file.projectTitle || 'Unassigned'}</div>
                  <select value={file.projectId || ''} onChange={(e) => assign(file, e.target.value).catch((err) => setStatus(err.message || 'Assignment failed'))} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-blue-400">
                    <option value="">— Unassigned —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                {file.publicUrl && <a href={file.publicUrl} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-blue-600"><Paperclip className="h-3.5 w-3.5" /></a>}
              </div>
            ))}
          </div>
        </div>
        {status && <div className={`rounded-lg px-3 py-2 text-[11.5px] ${/uploaded|attached/i.test(status) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{status}</div>}
      </div>
    </Drawer>
  )
}

export default function AdminWorkflowEnhancements() {
  const [navHost, setNavHost] = useState(null)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    let observer
    let host
    const install = () => {
      const nav = document.querySelector('.admin-dashboard-shell aside nav')
      if (!nav || nav.querySelector('[data-workflow-admin-host="true"]')) return
      host = document.createElement('div')
      host.dataset.workflowAdminHost = 'true'
      host.className = 'mt-2 pt-2 border-t border-white/[.07] space-y-1'
      nav.appendChild(host)
      setNavHost(host)
    }
    install()
    observer = new MutationObserver(install)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { observer?.disconnect(); setNavHost(null); if (host?.isConnected) host.remove() }
  }, [])

  return (
    <>
      {navHost && createPortal(
        <>
          <SidebarAction icon={Wrench} label="Skills & Tools" onClick={() => setSkillsOpen(true)} />
          <SidebarAction icon={FolderOpen} label="Project Files" onClick={() => setFilesOpen(true)} />
        </>, navHost)}
      <SkillsToolsDrawer open={skillsOpen} onClose={() => setSkillsOpen(false)} />
      <ProjectFilesDrawer open={filesOpen} onClose={() => setFilesOpen(false)} />
    </>
  )
}
