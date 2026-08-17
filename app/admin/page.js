'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, Trash2, File as FileIcon, Loader2, Check, Plus,
  Download, ExternalLink, Search, FolderOpen, Sparkles, ArrowLeft, LogOut,
  ChevronDown, ChevronRight, Save, RotateCcw, Eye, EyeOff, Star, User,
  Briefcase, Award, BarChart3, LineChart, Layers, Settings, ShieldAlert,
  Handshake, Building2, Tag, Quote, GraduationCap, BadgeCheck, Globe,
  Activity, Users, MousePointerClick, TrendingUp,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SEED_CONTENT, ACCENT_OPTIONS, CATEGORY_OPTIONS } from '@/lib/portfolio-data'
import { CATEGORY_META, formatBytes, previewUrl } from '@/lib/file-utils'

const TOKEN_KEY = 'portfolio_admin_token'

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/* ========================== AUTH ========================== */

function useAdminToken() {
  const [token, setToken] = useState(null)
  useEffect(() => { setToken(typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null) }, [])
  const save = (t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t) }
  const clear = () => { localStorage.removeItem(TOKEN_KEY); setToken(null) }
  return { token, save, clear }
}

const authHeaders = (token) => (token ? { 'x-admin-token': token } : {})

function LoginGate({ onAuthed }) {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const data = await res.json()
      if (res.ok && data.token) onAuthed(data.token)
      else setErr(data.error || 'Login failed')
    } catch { setErr('Network error') } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-white">
      <div className="absolute inset-0 hero-radial" />
      <div className="absolute inset-0 subtle-grid" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm p-8 rounded-2xl glass-strong">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <h1 className="mt-6 font-semibold text-3xl tracking-tight text-slate-900">Admin sign in</h1>
        <p className="mt-2 text-[13px] text-slate-500">Enter the password to manage site content and files.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-6 w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
        />
        {err && <div className="mt-3 text-[12px] text-red-600">{err}</div>}
        <Button type="submit" disabled={loading} className="mt-5 w-full bg-blue-600 text-white hover:bg-blue-700 h-10">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="mt-4 text-[11px] text-slate-400">Default password: <span className="font-mono text-slate-500">admin</span> · change <span className="font-mono text-slate-500">ADMIN_PASSWORD</span> in .env.</div>
      </form>
    </div>
  )
}

/* ==================== SHARED FORM ATOMS ==================== */

const Label = ({ children }) => (<div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">{children}</div>)

const Field = ({ label, hint, children }) => (
  <div>
    {label && <Label>{label}</Label>}
    {children}
    {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
  </div>
)

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition'

const TextInput = ({ value = '', onChange, placeholder, className = '', ...rest }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...rest}
    className={`${inputCls} ${className}`} />
)

const TextArea = ({ value = '', onChange, placeholder, rows = 4 }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className={`${inputCls} resize-y`} />
)

const SelectInput = ({ value, onChange, options = [], placeholder }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputCls}>
    {placeholder && <option value="" className="bg-white">{placeholder}</option>}
    {options.map((o) => <option key={o.value ?? o} value={o.value ?? o} className="bg-white">{o.label ?? o}</option>)}
  </select>
)

// ArrayOfStrings — comma/enter separated, chip UI
const StringListField = ({ items = [], onChange, placeholder = 'Add item…' }) => {
  const [draft, setDraft] = useState('')
  const add = (v) => { const t = (v ?? draft).trim(); if (!t) return; onChange([...(items || []), t]); setDraft('') }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
            {it}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <TextInput value={draft} onChange={setDraft} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={() => add()} className="text-[12px] px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shrink-0">Add</button>
      </div>
    </div>
  )
}

// Object-list field with a per-row renderer
const ObjectListField = ({ items = [], onChange, newItem, render, addLabel = 'Add', minimalOnEmpty }) => {
  const add = () => onChange([...(items || []), (typeof newItem === 'function' ? newItem() : { ...newItem })])
  const remove = (i) => onChange((items || []).filter((_, j) => j !== i))
  const update = (i, patch) => onChange((items || []).map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const move = (i, dir) => {
    const arr = [...(items || [])]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1 pt-1 text-slate-300">
              <button type="button" onClick={() => move(i, -1)} className="hover:text-blue-600" title="Move up">↑</button>
              <button type="button" onClick={() => move(i, +1)} className="hover:text-blue-600" title="Move down">↓</button>
            </div>
            <div className="flex-1">{render(it, (patch) => update(i, patch), i)}</div>
            <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500" title="Remove"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {(!items || items.length === 0) && !minimalOnEmpty && <div className="text-[12px] text-slate-400 italic">None yet.</div>}
      <button type="button" onClick={add} className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition">
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  )
}

/* ==================== FILE MANAGER (existing, restyled) ==================== */

const ALL_PROJECTS_STATIC = (projects) => [{ id: '', title: '— Unassigned —' }, ...(projects || []).map((p) => ({ id: p.id, title: p.title }))]

function useFiles(token) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch('/api/files'); const data = await r.json(); setFiles(Array.isArray(data) ? data : []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { files, setFiles, loading, refresh }
}

function UploadDropzone({ token, projects, onUploaded }) {
  const [dragOver, setDragOver] = useState(false)
  const [queue, setQueue] = useState([])
  const [projectId, setProjectId] = useState('')
  const inputRef = useRef(null)
  const projectTitle = useMemo(() => (projects || []).find((p) => p.id === projectId)?.title || null, [projectId, projects])
  const uploadOne = useCallback((item) => new Promise((resolve) => {
    const form = new FormData()
    form.append('file', item.file)
    if (projectId) { form.append('projectId', projectId); if (projectTitle) form.append('projectTitle', projectTitle) }
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/files/upload')
    if (token) xhr.setRequestHeader('x-admin-token', token)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) { const pct = Math.round((e.loaded / e.total) * 100); setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, progress: pct } : x))) }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { const res = JSON.parse(xhr.responseText); setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'done', progress: 100 } : x))); onUploaded?.(res.file) }
        catch { setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'error', error: 'bad response' } : x))) }
      } else { let msg = `HTTP ${xhr.status}`; try { msg = JSON.parse(xhr.responseText).error || msg } catch {}; setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'error', error: msg } : x))) }
      resolve()
    }
    xhr.onerror = () => { setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'error', error: 'network error' } : x))); resolve() }
    xhr.send(form)
  }), [projectId, projectTitle, onUploaded, token])
  const addFiles = useCallback((files) => {
    const list = Array.from(files || []); if (list.length === 0) return
    const items = list.map((f) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file: f, progress: 0, status: 'uploading' }))
    setQueue((q) => [...items, ...q])
    ;(async () => { for (const it of items) await uploadOne(it) })()
  }, [uploadOne])
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer?.files) }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Label>Attach to project</Label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-[260px]">
          {ALL_PROJECTS_STATIC(projects).map((p) => (<option key={p.id} value={p.id} className="bg-white">{p.title}</option>))}
        </select>
      </div>
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed cursor-pointer p-10 text-center transition-all ${dragOver ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/30'}`}>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.md,.zip,.py,.sql,.txt,image/*,video/*" />
        <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center"><Upload className="h-5 w-5 text-blue-600" /></div>
        <div className="mt-4 font-semibold text-2xl tracking-tight text-slate-900">Drop files or click to upload</div>
        <div className="mt-1 text-[13px] text-slate-500">PDF, Excel, PowerPoint, Word, CSV, Markdown, ZIP, Python, SQL, images, videos · up to 50 MB each</div>
      </div>
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {queue.map((it) => (
              <div key={it.id} className="p-3 rounded-lg bg-white border border-slate-200 flex items-center gap-3">
                <FileIcon className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] text-slate-700 truncate">{it.file.name}</div>
                    <div className="text-[11px] text-slate-400 shrink-0">{formatBytes(it.file.size)}</div>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full transition-all ${it.status === 'error' ? 'bg-red-500' : it.status === 'done' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${it.progress}%` }} />
                  </div>
                  {it.status === 'error' && <div className="mt-1 text-[11px] text-red-500">{it.error}</div>}
                </div>
                <div className="shrink-0">
                  {it.status === 'uploading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                  {it.status === 'done' && <Check className="h-4 w-4 text-emerald-500" />}
                  {it.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilePreviewDialog({ file, open, onClose }) {
  const [text, setText] = useState(null)
  const isRawText = file && ['csv', 'markdown', 'python', 'sql', 'other'].includes(file.category) && file.size < 200 * 1024
  useEffect(() => {
    setText(null); if (!open || !isRawText || !file) return
    fetch(file.publicUrl).then((r) => r.text()).then(setText).catch(() => setText('(preview unavailable)'))
  }, [open, isRawText, file])
  if (!file) return null
  const url = previewUrl(file)
  const meta = CATEGORY_META[file.category] || CATEGORY_META.other
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl bg-white border-slate-200 p-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${meta.accent} flex items-center justify-center`}><span className="font-serif text-xl text-slate-900/70">{meta.emoji}</span></div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-semibold text-xl tracking-tight truncate text-slate-900">{file.label || file.originalName}</DialogTitle>
              <div className="text-[11px] uppercase tracking-widest text-slate-400 mt-0.5">{meta.label} · {formatBytes(file.size)}</div>
            </div>
            <a href={file.publicUrl} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"><Download className="h-3.5 w-3.5" /> Download</a>
            <a href={file.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-slate-950">
          {file.category === 'image' && (<img src={file.publicUrl} alt={file.label} className="max-h-[75vh] mx-auto" />)}
          {file.category === 'video' && (<video src={file.publicUrl} controls className="w-full max-h-[75vh]" />)}
          {(file.category === 'pdf' || ['word', 'excel', 'powerpoint'].includes(file.category)) && (<iframe src={url} className="w-full h-[75vh] bg-white" title={file.label} />)}
          {isRawText && (<pre className="p-6 text-[12.5px] text-slate-200 leading-relaxed overflow-auto max-h-[75vh] whitespace-pre-wrap font-mono">{text ?? 'Loading…'}</pre>)}
          {!['image', 'video', 'pdf', 'word', 'excel', 'powerpoint'].includes(file.category) && !isRawText && (
            <div className="p-10 text-center text-slate-400 text-sm">No in-browser preview available. <a href={file.publicUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline">Open the file</a>.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FileCard({ f, token, projects, onDelete, onOpen, onReassign }) {
  const meta = CATEGORY_META[f.category] || CATEGORY_META.other
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const handleDelete = async () => {
    if (!confirm(`Delete "${f.label || f.originalName}"?`)) return
    setBusy(true)
    try { const res = await fetch(`/api/files/${f.id}`, { method: 'DELETE', headers: authHeaders(token) }); if (res.ok) onDelete(f.id) }
    finally { setBusy(false) }
  }
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all">
      <button onClick={() => onOpen(f)} className="block w-full text-left">
        <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${meta.accent}`}>
          {f.category === 'image' ? (<img src={f.publicUrl} alt={f.label} className="absolute inset-0 w-full h-full object-cover" />) : (<div className="absolute inset-0 flex items-center justify-center"><span className="font-serif text-[120px] text-slate-900/[0.08] leading-none select-none">{meta.emoji}</span></div>)}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] text-slate-700 border border-slate-200">{meta.label}</div>
          <div className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded px-1.5 py-0.5 text-[10px] text-slate-600 font-mono">{formatBytes(f.size)}</div>
        </div>
        <div className="p-4">
          <div className="text-[13.5px] truncate font-medium text-slate-900">{f.label || f.originalName}</div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">{f.projectTitle || 'Unassigned'}</div>
        </div>
      </button>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => setEditing(true)} className="h-7 w-7 rounded-full bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center" title="Reassign"><FolderOpen className="h-3.5 w-3.5" /></button>
        <a href={f.publicUrl} target="_blank" rel="noreferrer" className="h-7 w-7 rounded-full bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center" title="Open"><ExternalLink className="h-3.5 w-3.5" /></a>
        <button disabled={busy} onClick={handleDelete} className="h-7 w-7 rounded-full bg-white/90 hover:bg-red-500 hover:text-white hover:border-red-500 border border-slate-200 text-slate-600 flex items-center justify-center transition" title="Delete">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
      </div>
      {editing && (
        <Dialog open={editing} onOpenChange={(v) => !v && setEditing(false)}>
          <DialogContent className="max-w-md bg-white border-slate-200">
            <DialogHeader><DialogTitle className="font-semibold text-xl text-slate-900">Reassign file</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Field label="Label"><TextInput defaultValue={f.label || f.originalName} id="lbl" onChange={() => {}} /></Field>
              <Field label="Project">
                <select defaultValue={f.projectId || ''} id="pid" className={inputCls}>
                  {ALL_PROJECTS_STATIC(projects).map((p) => (<option key={p.id} value={p.id} className="bg-white">{p.title}</option>))}
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</Button>
                <Button onClick={async () => {
                  const lbl = document.getElementById('lbl').value
                  const pid = document.getElementById('pid').value
                  const pt = (projects || []).find((p) => p.id === pid)?.title || null
                  const r = await fetch(`/api/files/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify({ label: lbl, projectId: pid || null, projectTitle: pt }) })
                  if (r.ok) { onReassign(f.id, { label: lbl, projectId: pid || null, projectTitle: pt }); setEditing(false) }
                }} className="bg-blue-600 text-white hover:bg-blue-700">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function FilesTab({ token, projects }) {
  const { files, setFiles, loading, refresh } = useFiles(token)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [proj, setProj] = useState('all')
  const [preview, setPreview] = useState(null)
  const CATS = ['all', 'pdf', 'excel', 'powerpoint', 'word', 'image', 'video', 'csv', 'markdown', 'python', 'sql', 'zip', 'other']
  const filtered = useMemo(() => files.filter((f) => {
    if (cat !== 'all' && f.category !== cat) return false
    if (proj === 'unassigned' ? !!f.projectId : proj !== 'all' && f.projectId !== proj) return false
    if (search && !`${f.label} ${f.originalName} ${f.projectTitle || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [files, cat, proj, search])
  return (
    <div>
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
        <UploadDropzone token={token} projects={projects} onUploaded={(f) => setFiles((prev) => [f, ...prev])} />
      </div>
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400">
          {CATS.map((c) => (<option key={c} value={c} className="bg-white">{c === 'all' ? 'All types' : (CATEGORY_META[c]?.label || c)}</option>))}
        </select>
        <select value={proj} onChange={(e) => setProj(e.target.value)} className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400">
          <option value="all" className="bg-white">All projects</option>
          <option value="unassigned" className="bg-white">— Unassigned —</option>
          {(projects || []).map((p) => (<option key={p.id} value={p.id} className="bg-white">{p.title}</option>))}
        </select>
        <button onClick={refresh} className="text-[12px] text-slate-500 hover:text-slate-900 transition px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50">Refresh</button>
        <div className="ml-auto text-[12px] text-slate-400">{loading ? 'Loading…' : `${filtered.length} of ${files.length} files`}</div>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((f) => (
          <FileCard key={f.id} f={f} token={token} projects={projects} onDelete={(id) => setFiles((prev) => prev.filter((x) => x.id !== id))} onOpen={setPreview} onReassign={(id, patch) => setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))} />
        ))}
      </div>
      {!loading && filtered.length === 0 && (
        <div className="mt-10 p-16 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
          <FolderOpen className="h-8 w-8 mx-auto text-slate-300" />
          <div className="mt-3 font-semibold text-xl text-slate-900">No files yet</div>
          <div className="text-[13px] mt-1">Drop your first PDF, deck or model above.</div>
        </div>
      )}
      <FilePreviewDialog file={preview} open={!!preview} onClose={() => setPreview(null)} />
    </div>
  )
}

/* ==================== FOCAL POINT PICKER ==================== */

// Click or drag on the full portrait to choose where the hero crop is
// centered. Value is stored as { x, y } percentages and consumed on the
// public site via `style={{ objectPosition: '${x}% ${y}%' }}`.
function FocalPointPicker({ src, value, onChange }) {
  const wrapRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const point = { x: value?.x ?? 50, y: value?.y ?? 30 }

  const updateFromEvent = useCallback((e) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
    onChange({ x: Math.round(x), y: Math.round(y) })
  }, [onChange])

  const onPointerDown = (e) => {
    e.preventDefault()
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    updateFromEvent(e)
  }
  const onPointerMove = (e) => { if (dragging) updateFromEvent(e) }
  const endDrag = () => setDragging(false)

  if (!src) return null

  return (
    <div>
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative inline-block w-full max-w-xs rounded-xl overflow-hidden border border-slate-200 cursor-crosshair select-none touch-none"
      >
        <img src={src} alt="" draggable={false} className="w-full h-auto block pointer-events-none" />
        <div className="absolute inset-y-0 w-px bg-blue-500/60 pointer-events-none" style={{ left: `${point.x}%` }} />
        <div className="absolute inset-x-0 h-px bg-blue-500/60 pointer-events-none" style={{ top: `${point.y}%` }} />
        <div
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_0_1.5px_rgba(37,99,235,0.55)] pointer-events-none"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[12px] text-slate-500">
          Focal point: <span className="font-mono text-slate-700">{point.x}%, {point.y}%</span> · click or drag to reposition
        </div>
        <button type="button" onClick={() => onChange({ x: 50, y: 30 })} className="text-[12px] px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition shrink-0">
          Reset to default
        </button>
      </div>
      <div className="mt-4">
        <Label>Live preview (as shown in the hero)</Label>
        <div className="w-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <img src={src} alt="" className="w-full aspect-[3/4] object-cover" style={{ objectPosition: `${point.x}% ${point.y}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ==================== CONTENT EDITOR SECTIONS ==================== */

function OwnerEditor({ owner, onChange, imageFiles }) {
  const set = (k, v) => onChange({ ...owner, [k]: v })
  const imageOptions = [{ label: '— None (use default) —', value: '' }, ...imageFiles.map((f) => ({ label: f.label || f.originalName, value: f.publicUrl }))]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name"><TextInput value={owner.name} onChange={(v) => set('name', v)} /></Field>
        <Field label="Role headline"><TextInput value={owner.role} onChange={(v) => set('role', v)} placeholder="Strategic Finance · Corporate Strategy · …" /></Field>
        <Field label="Current title (shown on portrait card)"><TextInput value={owner.currentRole || ''} onChange={(v) => set('currentRole', v)} placeholder="Associate · M&A + Strategic Finance" /></Field>
        <Field label="Location"><TextInput value={owner.location} onChange={(v) => set('location', v)} /></Field>
        <Field label="Email"><TextInput value={owner.email} onChange={(v) => set('email', v)} /></Field>
        <Field label="LinkedIn URL"><TextInput value={owner.linkedin} onChange={(v) => set('linkedin', v)} /></Field>
        <Field label="Resume URL" hint="Paste a public URL — or upload in the Files tab and paste the URL here."><TextInput value={owner.resumeUrl || ''} onChange={(v) => set('resumeUrl', v)} placeholder="https://…" /></Field>
        <Field label="Portrait image (from uploads)">
          <SelectInput value={owner.portraitUrl || ''} onChange={(v) => set('portraitUrl', v)} options={imageOptions} />
        </Field>
      </div>
      {owner.portraitUrl && (
        <Field label="Portrait focal point" hint="Controls where the hero crop centers on the image, since the hero card is a tall 3:4 frame.">
          <FocalPointPicker src={owner.portraitUrl} value={owner.portraitFocal} onChange={(v) => set('portraitFocal', v)} />
        </Field>
      )}
      <Field label="Hero tagline (appears under name)"><TextArea value={owner.tagline} onChange={(v) => set('tagline', v)} rows={2} /></Field>
      <Field label="Bio (appears in Contact section)"><TextArea value={owner.bio} onChange={(v) => set('bio', v)} rows={3} /></Field>
      <Field label="Availability (Recruiter-mode banner)"><TextArea value={owner.availability} onChange={(v) => set('availability', v)} rows={2} /></Field>
      <div>
        <Label>Hero metrics (4 recommended)</Label>
        <ObjectListField items={owner.metrics || []} onChange={(v) => set('metrics', v)} newItem={{ value: '', label: '' }} addLabel="Add metric" render={(m, u) => (
          <div className="grid grid-cols-2 gap-2">
            <TextInput value={m.value} onChange={(v) => u({ value: v })} placeholder="$4.8B+" />
            <TextInput value={m.label} onChange={(v) => u({ label: v })} placeholder="Transactions supported" />
          </div>
        )} />
      </div>
    </div>
  )
}

function ChaptersEditor({ chapters, onChange }) {
  const [why, how] = chapters
  const setWhy = (patch) => onChange([{ ...why, ...patch }, how])
  const setHow = (patch) => onChange([why, { ...how, ...patch }])
  return (
    <div className="space-y-8">
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-[11px] uppercase tracking-widest text-blue-600">Chapter I</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kicker"><TextInput value={why.kicker} onChange={(v) => setWhy({ kicker: v })} /></Field>
          <Field label="Title"><TextInput value={why.title} onChange={(v) => setWhy({ title: v })} /></Field>
        </div>
        <Field label="Body"><TextArea value={why.body} onChange={(v) => setWhy({ body: v })} rows={4} /></Field>
      </div>
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-[11px] uppercase tracking-widest text-blue-600">Chapter II</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kicker"><TextInput value={how.kicker} onChange={(v) => setHow({ kicker: v })} /></Field>
          <Field label="Title"><TextInput value={how.title} onChange={(v) => setHow({ title: v })} /></Field>
        </div>
        <div className="mt-4">
          <Label>Principles (4 recommended)</Label>
          <ObjectListField items={how.principles || []} onChange={(v) => setHow({ principles: v })} newItem={{ t: '', d: '' }} addLabel="Add principle" render={(p, u) => (
            <div className="space-y-2">
              <TextInput value={p.t} onChange={(v) => u({ t: v })} placeholder="Assumptions are the product." />
              <TextArea value={p.d} onChange={(v) => u({ d: v })} placeholder="A model is only as valuable as…" rows={2} />
            </div>
          )} />
        </div>
      </div>
    </div>
  )
}

function ProjectRow({ p, expanded, onToggle, onChange, onDelete, imageFiles }) {
  const set = (k, v) => onChange({ ...p, [k]: v })
  const imageOptions = [{ label: '— None (use gradient + emoji) —', value: '' }, ...imageFiles.map((f) => ({ label: f.label || f.originalName, value: f.publicUrl }))]
  return (
    <div className={`rounded-xl border ${expanded ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-blue-200'} transition`}>
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${p.accent} flex items-center justify-center shrink-0 overflow-hidden`}>
          {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" className="w-full h-full object-cover" /> : <span className="font-serif text-2xl text-slate-900/70">{p.coverEmoji || '◇'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">{p.category}</div>
            {p.featured && <div className="text-[10px] text-amber-600 inline-flex items-center"><Star className="h-3 w-3 inline mr-1 fill-amber-400 text-amber-500" />Featured</div>}
            {p.hidden && <div className="text-[10px] text-slate-400 inline-flex items-center"><EyeOff className="h-3 w-3 inline mr-1" />Hidden</div>}
          </div>
          <div className="mt-0.5 font-semibold text-lg truncate text-slate-900">{p.title || <span className="italic text-slate-400">(untitled)</span>}</div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-5 border-t border-slate-100">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ID / slug (immutable-ish)"><TextInput value={p.id} onChange={(v) => set('id', v)} placeholder="ma-tmt-2b" /></Field>
            <Field label="Title"><TextInput value={p.title} onChange={(v) => set('title', v)} /></Field>
            <Field label="Category"><SelectInput value={p.category} onChange={(v) => set('category', v)} options={CATEGORY_OPTIONS} /></Field>
            <Field label="Industry"><TextInput value={p.industry} onChange={(v) => set('industry', v)} /></Field>
            <Field label="Year"><TextInput type="number" value={p.year} onChange={(v) => set('year', Number(v) || p.year)} /></Field>
            <Field label="Reading minutes"><TextInput type="number" value={p.readingMinutes} onChange={(v) => set('readingMinutes', Number(v) || 0)} /></Field>
            <Field label="Impact (one-liner)"><TextInput value={p.impact} onChange={(v) => set('impact', v)} placeholder="$2.4B enterprise value; 3 confirmatory bids" /></Field>
            <Field label="Cover emoji / symbol"><TextInput value={p.coverEmoji || ''} onChange={(v) => set('coverEmoji', v)} placeholder="⌘ ∫ ◐ …" /></Field>
            <Field label="Accent gradient">
              <SelectInput value={p.accent} onChange={(v) => set('accent', v)} options={ACCENT_OPTIONS} />
            </Field>
            <Field label="Cover image (optional, overrides emoji)">
              <SelectInput value={p.coverImageUrl || ''} onChange={(v) => set('coverImageUrl', v)} options={imageOptions} />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <Switch checked={!!p.featured} onCheckedChange={(v) => set('featured', v)} />
              <span>Featured (shows in Recruiter Mode)</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <Switch checked={!!p.hidden} onCheckedChange={(v) => set('hidden', v)} />
              <span>Hidden (confidential — not shown publicly)</span>
            </label>
          </div>
          <div className="mt-5">
            <Field label="Executive summary (Recruiter summary block)"><TextArea value={p.executiveSummary} onChange={(v) => set('executiveSummary', v)} rows={4} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Business problem"><TextArea value={p.problem} onChange={(v) => set('problem', v)} rows={3} /></Field>
          </div>
          <div className="mt-4">
            <Label>Metrics (3 recommended)</Label>
            <ObjectListField items={p.metrics || []} onChange={(v) => set('metrics', v)} newItem={{ k: '', v: '' }} addLabel="Add metric" render={(m, u) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={m.v} onChange={(v) => u({ v })} placeholder="$2.4B" />
                <TextInput value={m.k} onChange={(v) => u({ k: v })} placeholder="EV" />
              </div>
            )} />
          </div>
          <div className="mt-4">
            <Label>Approach (numbered steps)</Label>
            <ObjectListField items={(p.approach || []).map((s) => ({ s }))} onChange={(v) => set('approach', v.map((x) => x.s))} newItem={{ s: '' }} addLabel="Add step" render={(x, u) => (
              <TextArea value={x.s} onChange={(v) => u({ s: v })} rows={2} placeholder="Rebuilt the three-statement operating model bottoms-up from cohort ARR data." />
            )} />
          </div>
          <div className="mt-4">
            <Label>Deliverables</Label>
            <StringListField items={p.deliverables || []} onChange={(v) => set('deliverables', v)} placeholder="Operating model (Excel)" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tools</Label>
              <StringListField items={p.tools || []} onChange={(v) => set('tools', v)} placeholder="Excel" />
            </div>
            <div>
              <Label>Tags</Label>
              <StringListField items={p.tags || []} onChange={(v) => set('tags', v)} placeholder="M&A" />
            </div>
          </div>
          <div className="mt-4">
            <Field label="Key learning (pull quote)"><TextArea value={p.learnings} onChange={(v) => set('learnings', v)} rows={2} /></Field>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => { if (confirm(`Delete project "${p.title}"?`)) onDelete() }} className="text-[12px] text-red-500 hover:text-red-600 inline-flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete project</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectsEditor({ projects, onChange, imageFiles }) {
  const [openId, setOpenId] = useState(null)
  const add = () => {
    const newP = {
      id: `new-${Date.now().toString(36)}`, title: 'New project', category: 'M&A', industry: 'Industry', year: new Date().getFullYear(),
      accent: ACCENT_OPTIONS[0], coverEmoji: '◇', tags: [], tools: [], impact: '', metrics: [],
      featured: false, hidden: false, executiveSummary: '', problem: '', approach: [], deliverables: [],
      learnings: '', readingMinutes: 5,
    }
    onChange([newP, ...projects])
    setOpenId(newP.id)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px] text-slate-500">{projects.length} project{projects.length === 1 ? '' : 's'}</div>
        <button onClick={add} className="inline-flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"><Plus className="h-4 w-4" /> New project</button>
      </div>
      <div className="space-y-2">
        {projects.map((p) => (
          <ProjectRow key={p.id} p={p} expanded={openId === p.id} onToggle={() => setOpenId(openId === p.id ? null : p.id)} onChange={(np) => onChange(projects.map((x) => (x.id === p.id ? np : x)))} onDelete={() => onChange(projects.filter((x) => x.id !== p.id))} imageFiles={imageFiles} />
        ))}
      </div>
    </div>
  )
}

function SkillsEditor({ skills, onChange }) {
  return (
    <ObjectListField items={skills} onChange={onChange} newItem={{ group: 'New group', items: [] }} addLabel="Add group" render={(g, u) => (
      <div className="space-y-3">
        <Field label="Group name"><TextInput value={g.group} onChange={(v) => u({ group: v })} placeholder="Finance & Valuation" /></Field>
        <Field label="Skills"><StringListField items={g.items || []} onChange={(v) => u({ items: v })} placeholder="DCF" /></Field>
      </div>
    )} />
  )
}

function ExperienceEditor({ experience, onChange }) {
  return (
    <ObjectListField items={experience} onChange={onChange} newItem={{ company: 'New Company', role: '', period: '', location: '', bullets: [] }} addLabel="Add experience" render={(e, u) => (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company"><TextInput value={e.company} onChange={(v) => u({ company: v })} /></Field>
          <Field label="Role"><TextInput value={e.role} onChange={(v) => u({ role: v })} /></Field>
          <Field label="Period"><TextInput value={e.period} onChange={(v) => u({ period: v })} placeholder="2023 — Present" /></Field>
          <Field label="Location"><TextInput value={e.location} onChange={(v) => u({ location: v })} /></Field>
        </div>
        <Field label="Bullets"><StringListField items={e.bullets || []} onChange={(v) => u({ bullets: v })} placeholder="Led modelling on 6 sell-side mandates…" /></Field>
      </div>
    )} />
  )
}

function CategoriesEditor({ categories, onChange }) {
  return (
    <Field label="Category chips (order shown on the site)">
      <StringListField items={categories || []} onChange={onChange} placeholder="M&A" />
    </Field>
  )
}

/* -------------------- NEW: Expertise chips -------------------- */

function ExpertiseEditor({ expertise, onChange }) {
  return (
    <div className="max-w-2xl">
      <Field label="Expertise chips" hint="Short skill/keyword tags — used to summarise your headline focus areas.">
        <StringListField items={expertise || []} onChange={onChange} placeholder="M&A" />
      </Field>
    </div>
  )
}

/* -------------------- NEW: Selected Transactions -------------------- */

function TransactionsEditor({ transactions, projects, onChange }) {
  const projectOptions = [{ label: '— No linked case study —', value: '' }, ...(projects || []).map((p) => ({ label: p.title, value: p.id }))]
  return (
    <div>
      <div className="mb-4 text-[13px] text-slate-500">{(transactions || []).length} transaction{(transactions || []).length === 1 ? '' : 's'} · tombstone cards shown in "Selected Transactions"</div>
      <ObjectListField
        items={transactions || []}
        onChange={onChange}
        addLabel="Add transaction"
        newItem={() => ({
          id: newId('t'), dealNumber: '#000', year: new Date().getFullYear(), target: 'New Target',
          subtitle: '', type: 'Valuation', size: '', sector: '', role: '', tools: [], outcome: '', projectId: null,
        })}
        render={(t, u) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Deal number"><TextInput value={t.dealNumber} onChange={(v) => u({ dealNumber: v })} placeholder="#001" /></Field>
              <Field label="Year"><TextInput type="number" value={t.year} onChange={(v) => u({ year: Number(v) || t.year })} /></Field>
              <Field label="Type"><TextInput value={t.type} onChange={(v) => u({ type: v })} placeholder="M&A · Sell-Side" /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Target / counterparty"><TextInput value={t.target} onChange={(v) => u({ target: v })} placeholder="Arohan Financial Services" /></Field>
              <Field label="Subtitle"><TextInput value={t.subtitle} onChange={(v) => u({ subtitle: v })} placeholder="Pre-IPO diligence & valuation support" /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Size / metric"><TextInput value={t.size} onChange={(v) => u({ size: v })} placeholder="₹1,850 Cr" /></Field>
              <Field label="Sector"><TextInput value={t.sector} onChange={(v) => u({ sector: v })} placeholder="Financial Services · NBFC" /></Field>
            </div>
            <Field label="Role"><TextInput value={t.role} onChange={(v) => u({ role: v })} placeholder="Financial modelling · Valuation range" /></Field>
            <Field label="Outcome"><TextArea value={t.outcome} onChange={(v) => u({ outcome: v })} rows={2} /></Field>
            <div>
              <Label>Tools</Label>
              <StringListField items={t.tools || []} onChange={(v) => u({ tools: v })} placeholder="Excel" />
            </div>
            <Field label="Linked case study" hint="Optional — makes the tombstone card clickable and opens the matching project.">
              <SelectInput value={t.projectId || ''} onChange={(v) => u({ projectId: v || null })} options={projectOptions} />
            </Field>
          </div>
        )}
      />
    </div>
  )
}

/* -------------------- NEW: Aspirational Firms -------------------- */

function AspirationsEditor({ aspirations, onChange }) {
  return (
    <div>
      <div className="mb-4 text-[13px] text-slate-500">Grouped firm lists shown in the "Aspirational Firms" credentials wall.</div>
      <ObjectListField
        items={aspirations || []}
        onChange={onChange}
        addLabel="Add firm group"
        newItem={{ group: 'New Group', firms: [] }}
        render={(g, u) => (
          <div className="space-y-3">
            <Field label="Group name"><TextInput value={g.group} onChange={(v) => u({ group: v })} placeholder="Bulge Bracket" /></Field>
            <Field label="Firms"><StringListField items={g.firms || []} onChange={(v) => u({ firms: v })} placeholder="Goldman Sachs" /></Field>
          </div>
        )}
      />
    </div>
  )
}

/* -------------------- NEW: Testimonials -------------------- */

function TestimonialsEditor({ testimonials, onChange, imageFiles }) {
  const avatarOptions = [{ label: '— None (use initials) —', value: '' }, ...imageFiles.map((f) => ({ label: f.label || f.originalName, value: f.publicUrl }))]
  return (
    <div>
      <div className="mb-4 text-[13px] text-slate-500">Quotes shown in "Selected references."</div>
      <ObjectListField
        items={testimonials || []}
        onChange={onChange}
        addLabel="Add testimonial"
        newItem={() => ({ id: newId('test'), quote: '', name: '', title: '', company: '', avatarUrl: '' })}
        render={(t, u) => (
          <div className="space-y-3">
            <Field label="Quote"><TextArea value={t.quote} onChange={(v) => u({ quote: v })} rows={3} placeholder="Deepak's LBO model was the first one I did not have to rebuild from scratch…" /></Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Name"><TextInput value={t.name} onChange={(v) => u({ name: v })} placeholder="Priya Ramanathan" /></Field>
              <Field label="Title"><TextInput value={t.title} onChange={(v) => u({ title: v })} placeholder="Managing Director, M&A" /></Field>
              <Field label="Company"><TextInput value={t.company} onChange={(v) => u({ company: v })} placeholder="Meridian Corporate Advisory" /></Field>
            </div>
            <Field label="Avatar (optional — falls back to initials)">
              <SelectInput value={t.avatarUrl || ''} onChange={(v) => u({ avatarUrl: v })} options={avatarOptions} />
            </Field>
          </div>
        )}
      />
    </div>
  )
}

/* -------------------- NEW: Education -------------------- */

function EducationEditor({ education, onChange }) {
  return (
    <div>
      <div className="mb-4 text-[13px] text-slate-500">Shown alongside Experience.</div>
      <ObjectListField
        items={education || []}
        onChange={onChange}
        addLabel="Add education"
        newItem={() => ({ id: newId('edu'), degree: '', institution: '', period: '', location: '', details: '' })}
        render={(e, u) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Degree"><TextInput value={e.degree} onChange={(v) => u({ degree: v })} placeholder="MBA · Finance & Strategy" /></Field>
              <Field label="Institution"><TextInput value={e.institution} onChange={(v) => u({ institution: v })} placeholder="Indian School of Business (ISB)" /></Field>
              <Field label="Period"><TextInput value={e.period} onChange={(v) => u({ period: v })} placeholder="2017 — 2019" /></Field>
              <Field label="Location"><TextInput value={e.location} onChange={(v) => u({ location: v })} placeholder="Hyderabad" /></Field>
            </div>
            <Field label="Details"><TextArea value={e.details} onChange={(v) => u({ details: v })} rows={2} /></Field>
          </div>
        )}
      />
    </div>
  )
}

/* -------------------- NEW: Certifications -------------------- */

function CertificationsEditor({ certifications, onChange }) {
  return (
    <div>
      <div className="mb-4 text-[13px] text-slate-500">Professional credentials and coursework.</div>
      <ObjectListField
        items={certifications || []}
        onChange={onChange}
        addLabel="Add certification"
        newItem={() => ({ id: newId('cert'), name: '', issuer: '', year: new Date().getFullYear(), credentialUrl: '' })}
        render={(c, u) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Name"><TextInput value={c.name} onChange={(v) => u({ name: v })} placeholder="CFA Level II Candidate" /></Field>
            <Field label="Issuer"><TextInput value={c.issuer} onChange={(v) => u({ issuer: v })} placeholder="CFA Institute" /></Field>
            <Field label="Year"><TextInput type="number" value={c.year} onChange={(v) => u({ year: Number(v) || c.year })} /></Field>
            <Field label="Credential URL (optional)"><TextInput value={c.credentialUrl} onChange={(v) => u({ credentialUrl: v })} placeholder="https://…" /></Field>
          </div>
        )}
      />
    </div>
  )
}

/* -------------------- NEW: SEO -------------------- */

function SEOEditor({ seo = {}, onChange, imageFiles }) {
  const set = (k, v) => onChange({ ...seo, [k]: v })
  const imageOptions = [{ label: '— None —', value: '' }, ...imageFiles.map((f) => ({ label: f.label || f.originalName, value: f.publicUrl }))]
  return (
    <div className="max-w-2xl space-y-6">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-[12.5px] text-blue-800 leading-relaxed">
        Controls how the site appears in search engines and social-media link previews (meta title, description, keywords, and preview image).
      </div>
      <Field label="Meta title" hint={`${(seo.title || '').length} characters · ~60 recommended`}>
        <TextInput value={seo.title || ''} onChange={(v) => set('title', v)} placeholder="Deepak — Investment Banking, Strategic Finance & M&A" />
      </Field>
      <Field label="Meta description" hint={`${(seo.description || '').length} characters · ~160 recommended`}>
        <TextArea value={seo.description || ''} onChange={(v) => set('description', v)} rows={3} />
      </Field>
      <Field label="Keywords" hint="Comma-separated.">
        <TextArea value={seo.keywords || ''} onChange={(v) => set('keywords', v)} rows={2} />
      </Field>
      <Field label="Social preview image (og:image)" hint="Shown when the site is shared on LinkedIn, Twitter/X, etc.">
        <SelectInput value={seo.ogImageUrl || ''} onChange={(v) => set('ogImageUrl', v)} options={imageOptions} />
      </Field>
    </div>
  )
}

/* ==================== CONTENT TAB SHELL ==================== */

function ContentTab({ token, imageFiles }) {
  const [content, setContent] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [section, setSection] = useState('owner')

  useEffect(() => {
    fetch('/api/content').then((r) => r.json()).then((d) => setContent({ ...SEED_CONTENT, ...d })).catch(() => setContent(SEED_CONTENT))
  }, [])

  const patch = (k, v) => { setContent((c) => ({ ...c, [k]: v })); setDirty(true) }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(content) })
      if (res.ok) { setSavedAt(new Date()); setDirty(false) }
      else { const d = await res.json(); alert(d.error || 'Save failed') }
    } finally { setSaving(false) }
  }

  const reset = async () => {
    if (!confirm('Reset ALL content to defaults? This will overwrite all your edits.')) return
    const res = await fetch('/api/content/reset', { method: 'POST', headers: authHeaders(token) })
    if (res.ok) { const d = await res.json(); setContent(d.content); setDirty(false); setSavedAt(new Date()) }
  }

  if (!content) return <div className="p-10 text-center text-slate-400">Loading content…</div>

  const sections = [
    { id: 'owner', label: 'Owner', icon: User },
    { id: 'chapters', label: 'Chapters', icon: Layers },
    { id: 'expertise', label: 'Expertise', icon: Tag },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: Handshake },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'experience', label: 'Experience', icon: LineChart },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: BadgeCheck },
    { id: 'testimonials', label: 'Testimonials', icon: Quote },
    { id: 'aspirations', label: 'Aspirations', icon: Building2 },
    { id: 'categories', label: 'Categories', icon: BarChart3 },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'danger', label: 'Danger zone', icon: ShieldAlert },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <button key={s.id} onClick={() => setSection(s.id)} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition ${section === s.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                <Icon className="h-3.5 w-3.5" /> {s.label}
              </button>
            )
          })}
        </div>
      </aside>
      <div>
        <div className="sticky top-0 z-30 -mx-6 px-6 -mt-2 pt-2 pb-3 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="text-[12px] text-slate-400">
            {dirty ? <span className="text-blue-600">Unsaved changes</span> : savedAt ? <span>Saved {savedAt.toLocaleTimeString()}</span> : 'All up to date'}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving || !dirty} className="bg-blue-600 text-white hover:bg-blue-700 rounded-full h-9">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save changes
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {section === 'owner' && <OwnerEditor owner={content.owner} onChange={(v) => patch('owner', v)} imageFiles={imageFiles} />}
          {section === 'chapters' && <ChaptersEditor chapters={content.chapters} onChange={(v) => patch('chapters', v)} />}
          {section === 'expertise' && <ExpertiseEditor expertise={content.expertise} onChange={(v) => patch('expertise', v)} />}
          {section === 'projects' && <ProjectsEditor projects={content.projects} onChange={(v) => patch('projects', v)} imageFiles={imageFiles} />}
          {section === 'transactions' && <TransactionsEditor transactions={content.transactions} projects={content.projects} onChange={(v) => patch('transactions', v)} />}
          {section === 'skills' && <SkillsEditor skills={content.skills} onChange={(v) => patch('skills', v)} />}
          {section === 'experience' && <ExperienceEditor experience={content.experience} onChange={(v) => patch('experience', v)} />}
          {section === 'education' && <EducationEditor education={content.education} onChange={(v) => patch('education', v)} />}
          {section === 'certifications' && <CertificationsEditor certifications={content.certifications} onChange={(v) => patch('certifications', v)} />}
          {section === 'testimonials' && <TestimonialsEditor testimonials={content.testimonials} onChange={(v) => patch('testimonials', v)} imageFiles={imageFiles} />}
          {section === 'aspirations' && <AspirationsEditor aspirations={content.aspirations} onChange={(v) => patch('aspirations', v)} />}
          {section === 'categories' && <CategoriesEditor categories={content.categories} onChange={(v) => patch('categories', v)} />}
          {section === 'seo' && <SEOEditor seo={content.seo} onChange={(v) => patch('seo', v)} imageFiles={imageFiles} />}
          {section === 'danger' && (
            <div className="p-6 rounded-2xl border border-red-200 bg-red-50/60">
              <div className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-4 w-4" /> <span className="font-medium">Danger zone</span></div>
              <p className="mt-3 text-[14px] text-slate-600 max-w-lg">Reset every content section back to the seeded sample content. Your uploaded files are not touched.</p>
              <Button onClick={reset} className="mt-5 bg-red-600 hover:bg-red-700 text-white h-9 rounded-full">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset all content to defaults
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ==================== ANALYTICS TAB ==================== */

const KPI_RANGES = [7, 30, 90]

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200">
      <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">{value}</div>
      <div className="mt-2 text-[11.5px] text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-[10.5px] text-slate-400">{sub}</div>}
    </div>
  )
}

function AnalyticsTab({ token }) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics/summary?days=${days}`, { headers: authHeaders(token) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`) }
      setData(await res.json())
    } catch (e) { setError(e.message || 'Failed to load analytics') } finally { setLoading(false) }
  }, [days, token])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="text-[13px] text-slate-500">Pageviews, project views and resume clicks captured from the public site.</div>
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
          {KPI_RANGES.map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1 rounded-full text-[12px] transition ${days === d ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="p-10 text-center text-slate-400">Loading analytics…</div>}
      {!loading && error && (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50/60 text-[13px] text-red-600">
          Couldn't load analytics: {error}
        </div>
      )}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={TrendingUp} label={`Pageviews · last ${data.range.days}d`} value={data.range.pageviews} sub={`${data.allTime.pageviews} all-time`} />
            <KpiCard icon={Users} label={`Unique visitors · last ${data.range.days}d`} value={data.range.uniqueVisitors} />
            <KpiCard icon={Eye} label={`Project views · last ${data.range.days}d`} value={data.range.projectViews} sub={`${data.allTime.projectViews} all-time`} />
            <KpiCard icon={MousePointerClick} label={`Resume clicks · last ${data.range.days}d`} value={data.range.resumeClicks} sub={`${data.allTime.resumeClicks} all-time`} />
          </div>

          <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-900 mb-4">
              <Activity className="h-4 w-4 text-blue-600" /> Daily pageviews
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailySeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} labelStyle={{ color: '#0f172a' }} />
                  <Area type="monotone" dataKey="pageviews" stroke="#2563eb" strokeWidth={2} fill="url(#pvFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
            <div className="text-[13px] font-medium text-slate-900 mb-4">Top projects by views</div>
            {data.topProjects.length === 0 ? (
              <div className="text-[12.5px] text-slate-400 italic">No project views yet in this range.</div>
            ) : (
              <div className="space-y-2">
                {data.topProjects.map((p, i) => {
                  const max = data.topProjects[0].views || 1
                  return (
                    <div key={p.projectId} className="flex items-center gap-3">
                      <div className="w-5 text-[11px] text-slate-400 font-mono shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-slate-800 truncate">{p.projectTitle}</div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(4, (p.views / max) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-[12px] font-mono text-slate-500 shrink-0 w-10 text-right">{p.views}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ==================== MAIN ADMIN SHELL ==================== */

export default function AdminPage() {
  const { token, save: saveToken, clear: clearToken } = useAdminToken()
  const [tab, setTab] = useState('content')
  const [projectsForFiles, setProjectsForFiles] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    // fetch projects list for file attach dropdowns
    fetch('/api/content').then((r) => r.json()).then((d) => setProjectsForFiles((d?.projects || []).map((p) => ({ id: p.id, title: p.title })))).catch(() => {})
    // fetch image files for portrait/cover selectors
    fetch('/api/files').then((r) => r.json()).then((d) => setImageFiles((Array.isArray(d) ? d : []).filter((f) => f.category === 'image'))).catch(() => {})
  }, [token, tab])

  if (!mounted) return null
  if (!token) return <LoginGate onAuthed={saveToken} />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-blue-600 transition"><ArrowLeft className="h-3.5 w-3.5" /> Back to site</Link>
            <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">Admin</h1>
            <p className="mt-2 text-[14px] text-slate-500">Edit every element on the site, upload project files, and manage what recruiters see.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Storage: Supabase
            </div>
            <button onClick={clearToken} className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>
        </div>

        <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
          <button onClick={() => setTab('content')} className={`px-4 py-1.5 rounded-full text-[13px] transition ${tab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Content</button>
          <button onClick={() => setTab('files')} className={`px-4 py-1.5 rounded-full text-[13px] transition ${tab === 'files' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Files</button>
          <button onClick={() => setTab('analytics')} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] transition ${tab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}><Activity className="h-3.5 w-3.5" /> Analytics</button>
        </div>

        <div className="mt-8">
          {tab === 'content' && <ContentTab token={token} imageFiles={imageFiles} />}
          {tab === 'files' && <FilesTab token={token} projects={projectsForFiles} />}
          {tab === 'analytics' && <AnalyticsTab token={token} />}
        </div>
      </div>
    </div>
  )
}
