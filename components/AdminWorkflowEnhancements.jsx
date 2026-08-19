'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BadgeCheck, ChevronRight, FileImage, FileText, Loader2, Paperclip,
  Save, Upload, Wrench, X,
} from 'lucide-react'

const TOKEN_KEY = 'portfolio_admin_token'
const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function getToken() {
  return typeof window === 'undefined' ? '' : (localStorage.getItem(TOKEN_KEY) || '')
}

function Drawer({ open, title, subtitle, onClose, children }) {
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[170] bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-y-0 right-0 w-full max-w-[620px] bg-[#f8fafc] shadow-2xl border-l border-slate-200 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 md:px-6 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><Wrench className="h-4 w-4 text-blue-600" /></div>
          <div className="flex-1 min-w-0"><h2 className="text-[18px] font-semibold text-slate-950">{title}</h2><p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p></div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </div>,
    document.body,
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
      if (ti >= 0) groups[ti] = { ...groups[ti], items: toolItems }
      else groups.push({ group: 'Tools & Platforms', items: toolItems })
      const next = { ...content, skills: groups, tools: toolItems, expertise: expertiseItems }
      const r = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() }, body: JSON.stringify(next) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
      setContent(next); setStatus('Saved. Public Skills & Tools will update automatically.')
    } catch (e) { setStatus(e.message || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Skills & Tools" subtitle="Edit the recruiter-facing finance skills, platforms and expertise panels.">
      {!content ? <div className="py-12 text-center text-[12px] text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</div> : <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] uppercase tracking-widest text-blue-600">Financial skills</div><textarea rows={5} value={finance} onChange={(e) => setFinance(e.target.value)} className={`${inputCls} mt-3 resize-y`} /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] uppercase tracking-widest text-blue-600">Tools & platforms</div><textarea rows={5} value={tools} onChange={(e) => setTools(e.target.value)} className={`${inputCls} mt-3 resize-y`} /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] uppercase tracking-widest text-blue-600">Expertise areas</div><textarea rows={4} value={expertise} onChange={(e) => setExpertise(e.target.value)} className={`${inputCls} mt-3 resize-y`} /></div>
        {status && <div className={`rounded-lg px-3 py-2 text-[11px] ${/saved/i.test(status) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{status}</div>}
        <button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium flex items-center justify-center gap-2 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Skills & Tools</button>
      </div>}
    </Drawer>
  )
}

async function uploadViaExistingPipeline(file, project, label = '') {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('projectId', project.id)
    form.append('projectTitle', project.title || '')
    if (label) form.append('label', label)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/files/upload')
    xhr.setRequestHeader('x-admin-token', getToken())
    xhr.onload = () => {
      try {
        const d = JSON.parse(xhr.responseText || '{}')
        if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(d.error || `HTTP ${xhr.status}`))
        resolve(d.file || d)
      } catch (e) { reject(e) }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(form)
  })
}

async function imageThumbnail(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const node = new Image()
      node.onload = () => resolve(node)
      node.onerror = reject
      node.src = url
    })
    const ratio = img.naturalWidth / img.naturalHeight
    const width = Math.min(1400, img.naturalWidth || 1200)
    const height = Math.max(1, Math.round(width / ratio))
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (!blob) throw new Error('Could not create image thumbnail')
    return blob
  } finally { URL.revokeObjectURL(url) }
}

async function pdfFirstPageThumbnail(file) {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data: bytes }).promise
  const page = await pdf.getPage(1)
  const raw = page.getViewport({ scale: 1 })
  const scale = Math.min(2, 1400 / Math.max(1, raw.width))
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d', { alpha: false })
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: context, viewport }).promise
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) throw new Error('Could not render PDF first page')
  return blob
}

async function makeThumbnailFile(file, project) {
  let blob
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) blob = await pdfFirstPageThumbnail(file)
  else if (file.type?.startsWith('image/')) blob = await imageThumbnail(file)
  else return null
  const safe = String(project.id || 'project').replace(/[^a-z0-9_-]+/gi, '-')
  return new File([blob], `${safe}-thumbnail.jpg`, { type: 'image/jpeg' })
}

async function saveProjectCover(project, publicUrl) {
  const token = getToken()
  const r = await fetch('/api/content')
  const content = await r.json()
  const projects = (content.projects || []).map((p) => p.id === project.id ? { ...p, coverImageUrl: publicUrl } : p)
  const next = { ...content, projects }
  const wr = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(next) })
  if (!wr.ok) throw new Error((await wr.json().catch(() => ({}))).error || 'Could not save project thumbnail')

  // Keep the currently-open React project editor in sync so its later Save
  // does not overwrite the automatically generated cover URL.
  const idInput = [...document.querySelectorAll('input')].find((i) => i.value === project.id)
  const row = idInput?.closest('div.rounded-xl')
  if (row) {
    const coverSelect = [...row.querySelectorAll('select')].find((sel) => [...sel.options].some((o) => /gradient \+ emoji/i.test(o.textContent || '')))
    if (coverSelect) {
      if (![...coverSelect.options].some((o) => o.value === publicUrl)) {
        const option = document.createElement('option')
        option.value = publicUrl; option.textContent = 'Auto thumbnail from project file'
        coverSelect.appendChild(option)
      }
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
      setter?.call(coverSelect, publicUrl)
      coverSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
}

async function generateAndApplyThumbnail(sourceFile, project) {
  const thumb = await makeThumbnailFile(sourceFile, project)
  if (!thumb) return null
  const uploaded = await uploadViaExistingPipeline(thumb, project, `__project_thumbnail__:${sourceFile.name}`)
  if (!uploaded?.publicUrl) throw new Error('Thumbnail upload did not return a URL')
  await saveProjectCover(project, uploaded.publicUrl)
  return uploaded.publicUrl
}

function ProjectFilesInline({ project }) {
  const inputRef = useRef(null)
  const [allFiles, setAllFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [attachId, setAttachId] = useState('')

  const refresh = useCallback(async () => {
    const r = await fetch('/api/files')
    const d = await r.json()
    setAllFiles(Array.isArray(d) ? d : [])
  }, [])
  useEffect(() => { refresh().catch(() => {}) }, [refresh])

  const attached = useMemo(() => allFiles.filter((f) => f.projectId === project.id && !String(f.label || '').startsWith('__project_thumbnail__')), [allFiles, project.id])
  const available = useMemo(() => allFiles.filter((f) => f.projectId !== project.id && !String(f.label || '').startsWith('__project_thumbnail__')), [allFiles, project.id])

  const onUpload = async (files) => {
    const selected = Array.from(files || [])
    if (!selected.length) return
    setBusy(true); setStatus('')
    try {
      let first = null
      for (const file of selected) {
        const uploaded = await uploadViaExistingPipeline(file, project)
        if (!first) first = file
        setAllFiles((prev) => [uploaded, ...prev.filter((x) => x.id !== uploaded.id)])
      }
      if (first) {
        try {
          const cover = await generateAndApplyThumbnail(first, project)
          setStatus(cover ? `Uploaded ${selected.length} file${selected.length === 1 ? '' : 's'} · first page set as project thumbnail.` : `Uploaded ${selected.length} file${selected.length === 1 ? '' : 's'}. Automatic thumbnail supports PDF and image files.`)
        } catch (thumbError) {
          setStatus(`Files uploaded. Thumbnail could not be generated: ${thumbError.message}`)
        }
      }
      await refresh()
    } catch (e) { setStatus(e.message || 'Upload failed') }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = '' }
  }

  const attachExisting = async () => {
    const file = allFiles.find((f) => f.id === attachId)
    if (!file) return
    setBusy(true); setStatus('')
    try {
      const r = await fetch(`/api/files/${encodeURIComponent(file.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() }, body: JSON.stringify({ projectId: project.id, projectTitle: project.title }) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
      setAllFiles((prev) => prev.map((x) => x.id === file.id ? { ...x, projectId: project.id, projectTitle: project.title } : x))
      setAttachId('')
      if (file.category === 'pdf' || file.category === 'image' || /\.(pdf|png|jpe?g|webp)$/i.test(file.originalName || '')) {
        try {
          const response = await fetch(file.publicUrl)
          if (response.ok) {
            const blob = await response.blob()
            const source = new File([blob], file.originalName || file.label || 'project-file', { type: file.mimeType || blob.type })
            await generateAndApplyThumbnail(source, project)
            setStatus('Existing file attached · its first page/image is now the project thumbnail.')
          } else setStatus('Existing file attached to project.')
        } catch { setStatus('Existing file attached to project.') }
      } else setStatus('Existing file attached to project.')
    } catch (e) { setStatus(e.message || 'Could not attach file') }
    finally { setBusy(false) }
  }

  return (
    <div data-inline-project-files-ui="true" className="mt-5 rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-blue-50 bg-blue-50/45 flex items-center justify-between gap-3">
        <div><div className="text-[11px] uppercase tracking-[.14em] text-blue-700 font-medium flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> Project Files & Thumbnail</div><div className="mt-1 text-[10.5px] text-slate-500">Upload here and the file is attached to this project automatically. For PDF/image files, the first page/image becomes the project card thumbnail.</div></div>
        <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <div>
          <input ref={inputRef} className="hidden" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.md,.zip,.py,.sql,.txt,image/*,video/*" onChange={(e) => onUpload(e.target.files)} />
          <button disabled={busy} onClick={() => inputRef.current?.click()} className="w-full min-h-[86px] rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-blue-700 flex flex-col items-center justify-center gap-2 transition disabled:opacity-60">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-[12px] font-medium">{busy ? 'Working…' : 'Upload file for this project'}</span>
            <span className="text-[9.5px] text-slate-400">PDF, Excel, PPT, Word, images, ZIP and more</span>
          </button>
          <div className="mt-3 flex gap-2">
            <select value={attachId} onChange={(e) => setAttachId(e.target.value)} className={`${inputCls} flex-1 min-w-0`}>
              <option value="">— Attach an already uploaded file —</option>
              {available.map((f) => <option key={f.id} value={f.id}>{f.label || f.originalName} {f.projectTitle ? `(${f.projectTitle})` : '(unassigned)'}</option>)}
            </select>
            <button disabled={!attachId || busy} onClick={attachExisting} className="px-3 rounded-lg bg-slate-900 text-white text-[11px] font-medium disabled:opacity-40">Attach</button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between"><span className="text-[10px] uppercase tracking-widest text-slate-500">Attached files</span><span className="text-[9px] text-slate-400">{attached.length}</span></div>
          <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-100">{attached.length ? attached.map((f) => <div key={f.id} className="px-3 py-2.5 flex items-center gap-2"><span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">{f.category === 'image' ? <FileImage className="h-3.5 w-3.5 text-blue-600" /> : <FileText className="h-3.5 w-3.5 text-blue-600" />}</span><div className="flex-1 min-w-0"><div className="text-[10.5px] font-medium text-slate-700 truncate">{f.label || f.originalName}</div><div className="text-[9px] text-slate-400 truncate">{f.category || 'file'}</div></div>{f.publicUrl && <a href={f.publicUrl} target="_blank" rel="noreferrer" className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600"><Paperclip className="h-3 w-3" /></a>}</div>) : <div className="p-6 text-center text-[10px] text-slate-400">No files attached yet.</div>}</div>
        </div>
      </div>
      {status && <div className={`mx-4 mb-4 rounded-lg px-3 py-2 text-[10.5px] ${/uploaded|attached|thumbnail/i.test(status) && !/could not|failed/i.test(status) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>{status}</div>}
    </div>
  )
}

export default function AdminWorkflowEnhancements() {
  const [navHost, setNavHost] = useState(null)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectHosts, setProjectHosts] = useState([])

  const loadProjects = useCallback(() => fetch('/api/content').then((r) => r.json()).then((d) => setProjects(d?.projects || [])).catch(() => {}), [])
  useEffect(() => { loadProjects() }, [loadProjects])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    let observer
    let raf = 0

    const installSidebar = () => {
      const nav = document.querySelector('.admin-dashboard-shell aside nav')
      if (!nav) return
      let host = nav.querySelector('[data-workflow-admin-host="true"]')
      if (!host) {
        host = document.createElement('div')
        host.dataset.workflowAdminHost = 'true'
        host.className = 'mt-2 pt-2 border-t border-white/[.07]'
        nav.appendChild(host)
      }
      setNavHost(host)
    }

    const installProjectHosts = () => {
      const next = []
      for (const project of projects) {
        const idInput = [...document.querySelectorAll('input')].find((i) => i.value === project.id)
        if (!idInput) continue
        const row = idInput.closest('div.rounded-xl')
        if (!row) continue
        const expanded = [...row.children].find((node) => node instanceof HTMLElement && node.classList.contains('border-t'))
        if (!expanded) continue
        let host = expanded.querySelector(`[data-inline-project-files-host="${CSS.escape(project.id)}"]`)
        if (!host) {
          host = document.createElement('div')
          host.dataset.inlineProjectFilesHost = project.id
          expanded.appendChild(host)
        }
        next.push({ project, host })
      }
      setProjectHosts((prev) => {
        if (prev.length === next.length && prev.every((p, i) => p.project.id === next[i]?.project.id && p.host === next[i]?.host)) return prev
        return next
      })
    }

    const scan = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { installSidebar(); installProjectHosts() })
    }
    scan()
    observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { observer.disconnect(); cancelAnimationFrame(raf); setProjectHosts([]); setNavHost(null) }
  }, [projects])

  return (
    <>
      {navHost && createPortal(<button onClick={() => setSkillsOpen(true)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-slate-300 hover:bg-white/[.06] hover:text-white transition"><Wrench className="h-4 w-4" /><span className="flex-1">Skills & Tools</span><ChevronRight className="h-3.5 w-3.5 text-slate-600" /></button>, navHost)}
      {projectHosts.map(({ project, host }) => createPortal(<ProjectFilesInline key={project.id} project={project} />, host))}
      <SkillsToolsDrawer open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </>
  )
}
