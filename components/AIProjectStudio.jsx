'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  AlertCircle, BadgeCheck, BrainCircuit, Check, Eye, EyeOff, FileText,
  KeyRound, Loader2, Plus, RefreshCw, Save, ShieldCheck, Sparkles,
  Trash2, UploadCloud, WandSparkles, X,
} from 'lucide-react'

const SUPABASE_URL = 'https://mnppdqrhnpllzafufhtd.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0F_6IPrIRxn58J8y0OaAbQ_Dtf8VSa1'
const TOKEN_KEY = 'portfolio_admin_token'
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const CATEGORIES = [
  'Private Equity',
  'Investment Banking / M&A',
  'Special Situations / Distressed',
  'Hedge Fund',
  'Private Credit',
  'Growth Equity',
]

const accents = {
  'Private Equity': 'from-blue-500/25 to-indigo-500/15',
  'Investment Banking / M&A': 'from-sky-500/25 to-blue-500/15',
  'Special Situations / Distressed': 'from-slate-500/25 to-zinc-500/15',
  'Hedge Fund': 'from-cyan-500/25 to-blue-500/15',
  'Private Credit': 'from-indigo-500/25 to-slate-500/15',
  'Growth Equity': 'from-violet-500/25 to-blue-500/15',
}

const icons = {
  'Private Equity': 'PE',
  'Investment Banking / M&A': 'M&A',
  'Special Situations / Distressed': 'SS',
  'Hedge Fund': 'HF',
  'Private Credit': 'PC',
  'Growth Equity': 'GE',
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function adminHeaders(json = true) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) || '' : ''
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), 'x-admin-token': token }
}

function makeDraftId() {
  return `ai-project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function bytes(value) {
  const size = Number(value || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 ** 2).toFixed(1)} MB`
}

function arrayFromText(value) {
  return String(value || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean)
}

async function rawUpload(file, draftId, projectTitle, label = file.name) {
  const signedResponse = await fetch('/api/files/sign-upload', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      projectId: draftId,
      projectTitle,
      label,
    }),
  })
  const signed = await signedResponse.json().catch(() => ({}))
  if (!signedResponse.ok) throw new Error(signed.detail || signed.error || `Upload signing failed (HTTP ${signedResponse.status})`)

  const { error: uploadError } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadError) throw uploadError

  const finalResponse = await fetch('/api/files/finalize', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id: signed.id }),
  })
  const finalized = await finalResponse.json().catch(() => ({}))
  if (!finalResponse.ok) throw new Error(finalized.detail || finalized.error || `Upload finalization failed (HTTP ${finalResponse.status})`)
  return finalized.file
}

async function createThumbnail(source, draftId) {
  let blob = null
  if (source.type?.startsWith('image/')) {
    const objectUrl = URL.createObjectURL(source)
    try {
      const image = await new Promise((resolve, reject) => {
        const node = new Image()
        node.onload = () => resolve(node)
        node.onerror = reject
        node.src = objectUrl
      })
      const width = Math.min(1400, image.naturalWidth || 1200)
      const height = Math.max(1, Math.round(width / Math.max(0.1, image.naturalWidth / image.naturalHeight)))
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(image, 0, 0, width, height)
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
    } finally { URL.revokeObjectURL(objectUrl) }
  } else if (source.type === 'application/pdf' || /\.pdf$/i.test(source.name)) {
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs')
    if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await source.arrayBuffer()) }).promise
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: Math.min(2, 1400 / Math.max(1, base.width)) })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d', { alpha: false })
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: context, viewport }).promise
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
  }
  if (!blob) return null
  const thumbnail = new File([blob], `${draftId}-thumbnail.jpg`, { type: 'image/jpeg' })
  return rawUpload(thumbnail, draftId, 'AI project draft', `__project_thumbnail__:${source.name}`)
}

function Field({ label, children, hint }) {
  return <label className="block"><span className="text-[9.5px] uppercase tracking-[.14em] text-slate-400">{label}</span><div className="mt-1.5">{children}</div>{hint && <span className="mt-1 block text-[9.5px] text-slate-400">{hint}</span>}</label>
}

function Status({ message, type = 'info' }) {
  if (!message) return null
  const tone = type === 'error' ? 'border-red-100 bg-red-50 text-red-700' : type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-blue-100 bg-blue-50 text-blue-700'
  return <div className={`rounded-xl border px-3 py-2.5 text-[11px] ${tone}`}>{message}</div>
}

export default function AIProjectStudio() {
  const inputRef = useRef(null)
  const [draftId, setDraftId] = useState(makeDraftId)
  const [settings, setSettings] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState(null)
  const [files, setFiles] = useState([])
  const [queue, setQueue] = useState([])
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState(null)

  const loadSettings = useCallback(async () => {
    const response = await fetch('/api/ai-project/settings', { headers: adminHeaders(false), cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.detail || data.error || 'Could not load AI settings.')
    setSettings(data); setModel(data.model || DEFAULT_MODEL)
  }, [])

  useEffect(() => { loadSettings().catch((error) => setSettingsStatus({ type: 'error', message: error.message })) }, [loadSettings])

  const saveSettings = async () => {
    setSettingsBusy(true); setSettingsStatus(null)
    try {
      const response = await fetch('/api/ai-project/settings', {
        method: 'PUT', headers: adminHeaders(), body: JSON.stringify({ apiKey: apiKey.trim(), model }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.error || 'Gemini connection failed.')
      setSettings(data.settings); setApiKey('')
      setSettingsStatus({ type: 'success', message: 'Gemini key verified, encrypted and saved.' })
    } catch (error) { setSettingsStatus({ type: 'error', message: error.message }) }
    finally { setSettingsBusy(false) }
  }

  const testSettings = async () => {
    setSettingsBusy(true); setSettingsStatus(null)
    try {
      const response = await fetch('/api/ai-project/test', { method: 'POST', headers: adminHeaders(), body: '{}' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.error || 'Connection test failed.')
      setSettingsStatus({ type: 'success', message: data.message || 'Gemini connection verified.' })
      await loadSettings()
    } catch (error) { setSettingsStatus({ type: 'error', message: error.message }) }
    finally { setSettingsBusy(false) }
  }

  const uploadSelected = useCallback(async (selected) => {
    const list = Array.from(selected || []).slice(0, Math.max(0, 20 - files.length))
    if (!list.length) return
    const items = list.map((file) => ({ id: `${Date.now()}-${Math.random()}`, name: file.name, progress: 'uploading', error: '' }))
    setQueue((current) => [...items, ...current])
    let madeThumbnail = Boolean(thumbnailUrl)
    for (let index = 0; index < list.length; index += 1) {
      const file = list[index]
      const item = items[index]
      try {
        const uploaded = await rawUpload(file, draftId, 'AI project draft')
        setFiles((current) => [...current, uploaded])
        setQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: 'done' } : entry))
        if (!madeThumbnail && (file.type?.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
          try {
            const thumbnail = await createThumbnail(file, draftId)
            if (thumbnail?.publicUrl) { setThumbnailUrl(thumbnail.publicUrl); madeThumbnail = true }
          } catch { /* A thumbnail is helpful but not required for analysis. */ }
        }
      } catch (error) {
        setQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: 'error', error: error.message } : entry))
      }
    }
  }, [draftId, files.length, thumbnailUrl])

  const removeFile = async (file) => {
    const response = await fetch(`/api/files/${encodeURIComponent(file.id)}`, { method: 'DELETE', headers: adminHeaders(false) })
    if (response.ok) setFiles((current) => current.filter((item) => item.id !== file.id))
  }

  const analyze = async () => {
    if (!files.length) return
    setAnalyzing(true); setAnalysisStatus(null); setPublishStatus(null)
    try {
      const response = await fetch('/api/ai-project/analyze', {
        method: 'POST', headers: adminHeaders(), body: JSON.stringify({ draftId, fileIds: files.map((file) => file.id) }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.error || 'AI analysis failed.')
      setResult(data.analysis)
      setAnalysisStatus({ type: 'success', message: `${data.filesAnalyzed} file${data.filesAnalyzed === 1 ? '' : 's'} analyzed with ${data.model}. Review the fields below before publishing.` })
    } catch (error) { setAnalysisStatus({ type: 'error', message: error.message }) }
    finally { setAnalyzing(false) }
  }

  const update = (field, value) => setResult((current) => ({ ...current, [field]: value }))

  const publish = async () => {
    if (!result?.title) return
    setPublishing(true); setPublishStatus(null)
    try {
      const contentResponse = await fetch('/api/content', { cache: 'no-store' })
      const content = await contentResponse.json()
      const category = CATEGORIES.includes(result.category) ? result.category : CATEGORIES[0]
      const project = {
        id: draftId,
        title: result.title.trim(),
        category,
        industry: result.industry || 'Financial Analysis',
        year: Number(result.year) || new Date().getFullYear(),
        accent: accents[category],
        coverEmoji: icons[category],
        coverImageUrl: thumbnailUrl || '',
        tags: result.tags || [],
        tools: result.tools || [],
        impact: result.impact || '',
        metrics: result.metrics || [],
        featured: false,
        hidden: false,
        executiveSummary: result.executiveSummary || '',
        problem: result.problem || '',
        approach: result.approach || [],
        deliverables: result.deliverables || [],
        learnings: result.learnings || '',
        readingMinutes: Number(result.readingMinutes) || 6,
        analysisEvidence: result.evidence || [],
        analysisNotes: result.analysisNotes || [],
        createdBy: 'ai-project-upload',
      }
      const currentProjects = Array.isArray(content.projects) ? content.projects : []
      const exists = currentProjects.some((item) => item.id === draftId)
      const projects = exists ? currentProjects.map((item) => item.id === draftId ? project : item) : [project, ...currentProjects]
      const categories = Array.isArray(content.categories) ? [...content.categories] : []
      if (!categories.includes(category)) categories.push(category)
      const response = await fetch('/api/content', {
        method: 'PUT', headers: adminHeaders(), body: JSON.stringify({ ...content, projects, categories }),
      })
      const saved = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(saved.detail || saved.error || 'Could not publish the project.')

      await Promise.allSettled(files.map((file) => fetch(`/api/files/${encodeURIComponent(file.id)}`, {
        method: 'PATCH', headers: adminHeaders(), body: JSON.stringify({ projectId: draftId, projectTitle: project.title }),
      })))
      setPublishStatus({ type: 'success', message: 'Published. The project, thumbnail and attached files are now visible on the main portfolio page.' })
    } catch (error) { setPublishStatus({ type: 'error', message: error.message }) }
    finally { setPublishing(false) }
  }

  const resetDraft = () => {
    setDraftId(makeDraftId()); setFiles([]); setQueue([]); setThumbnailUrl(''); setResult(null); setAnalysisStatus(null); setPublishStatus(null)
  }

  const completedUploads = queue.filter((item) => item.progress === 'done').length
  const hasErrors = queue.some((item) => item.progress === 'error')
  const fileTotal = useMemo(() => files.reduce((sum, file) => sum + Number(file.size || 0), 0), [files])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_14px_45px_-36px_rgba(15,23,42,.45)]">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center shrink-0"><KeyRound className="h-4.5 w-4.5 text-blue-600" /></div>
          <div className="flex-1"><h2 className="text-[16px] font-semibold text-slate-950">AI API Keys</h2><p className="mt-1 text-[10.5px] text-slate-500">Google Gemini free tier · encrypted server-side · never sent to the public webpage</p></div>
          {settings?.hasApiKey && <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9.5px] text-emerald-700 inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Connected</span>}
        </div>
        <div className="p-5 md:p-6 grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-5">
          <div className="space-y-4">
            <Field label="Gemini API key" hint={settings?.hasApiKey ? `Saved key: ${settings.maskedKey}. Leave blank to keep it.` : 'Create a free key in Google AI Studio, then paste it here once.'}>
              <div className="relative"><input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={settings?.hasApiKey ? 'Enter a replacement key only if needed' : 'Paste Gemini API key'} className={`${inputClass} pr-11`} /><button type="button" onClick={() => setShowKey((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-blue-600">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            </Field>
            <Field label="Analysis model"><input value={model} onChange={(event) => setModel(event.target.value)} className={inputClass} /></Field>
            <div className="flex gap-2 flex-wrap">
              <button onClick={saveSettings} disabled={settingsBusy || (!apiKey.trim() && !settings?.hasApiKey)} className="h-10 rounded-xl bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">{settingsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Verify & save</button>
              {settings?.hasApiKey && <button onClick={testSettings} disabled={settingsBusy} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5" /> Test saved key</button>}
            </div>
            <Status message={settingsStatus?.message} type={settingsStatus?.type} />
          </div>
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-5">
            <div className="flex items-center gap-2 text-[11px] font-medium text-blue-800"><Sparkles className="h-4 w-4" /> Free analysis source</div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-600">Gemini’s free developer tier supports multimodal document analysis. PDFs and images are temporarily copied to Gemini for analysis; your permanent originals stay in Supabase.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[9.5px] text-slate-500"><div className="rounded-lg border border-white bg-white/75 p-2.5">PDF & image understanding</div><div className="rounded-lg border border-white bg-white/75 p-2.5">Excel / Word / PPTX extraction</div><div className="rounded-lg border border-white bg-white/75 p-2.5">Structured portfolio fields</div><div className="rounded-lg border border-white bg-white/75 p-2.5">Evidence & limitations</div></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6 flex items-center justify-between gap-3">
          <div><div className="text-[10px] uppercase tracking-[.16em] text-blue-600">Step 1</div><h2 className="mt-1 text-[16px] font-semibold text-slate-950">Upload the complete project package</h2><p className="mt-1 text-[10.5px] text-slate-500">All originals are stored permanently in Supabase and attached to this project.</p></div>
          <div className="text-right"><div className="text-[16px] font-semibold text-slate-900">{files.length}/20</div><div className="text-[9px] text-slate-400">{bytes(fileTotal)}</div></div>
        </div>
        <div className="p-5 md:p-6">
          <input ref={inputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.md,.zip,.py,.sql,.txt,.json,image/*,video/*,audio/*" onChange={(event) => { uploadSelected(event.target.files); event.target.value = '' }} />
          <button onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); uploadSelected(event.dataTransfer.files) }} className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/40'}`}>
            <span className="mx-auto h-12 w-12 rounded-2xl border border-blue-100 bg-white flex items-center justify-center shadow-sm"><UploadCloud className="h-5 w-5 text-blue-600" /></span><span className="mt-4 block text-[16px] font-semibold text-slate-900">Drop all project files here</span><span className="mt-1 block text-[10.5px] text-slate-500">PDF, Excel, Word, PowerPoint, CSV, ZIP, code, images, video or audio · 50 MB per file</span>
          </button>
          {(files.length > 0 || queue.length > 0) && <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
            {files.map((file) => <div key={file.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3"><span className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-blue-600" /></span><div className="min-w-0 flex-1"><div className="text-[11px] font-medium text-slate-800 truncate">{file.originalName}</div><div className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-400">{file.category} · {bytes(file.size)}</div></div><Check className="h-4 w-4 text-emerald-500" /><button onClick={() => removeFile(file)} className="h-8 w-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
            {queue.filter((item) => item.progress !== 'done').map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3"><span className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">{item.progress === 'error' ? <AlertCircle className="h-4 w-4 text-red-500" /> : <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}</span><div className="min-w-0 flex-1"><div className="text-[11px] font-medium text-slate-800 truncate">{item.name}</div><div className={`mt-0.5 text-[9px] ${item.progress === 'error' ? 'text-red-500' : 'text-slate-400'}`}>{item.error || 'Uploading to Supabase…'}</div></div></div>)}
          </div>}
          {queue.length > 0 && <div className={`mt-3 text-[10px] ${hasErrors ? 'text-amber-600' : 'text-slate-400'}`}>{completedUploads} uploaded{hasErrors ? ' · one or more files need attention' : ''}</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6 flex items-center justify-between gap-4">
          <div><div className="text-[10px] uppercase tracking-[.16em] text-blue-600">Step 2</div><h2 className="mt-1 text-[16px] font-semibold text-slate-950">Analyze and build the portfolio entry</h2><p className="mt-1 text-[10.5px] text-slate-500">AI reads the full package and prepares editable, evidence-backed project information.</p></div>
          <button onClick={analyze} disabled={analyzing || !files.length || !settings?.hasApiKey} className="h-11 rounded-xl bg-[#101b2d] px-4 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-2 shrink-0">{analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}{analyzing ? 'Analyzing all files…' : 'Analyze files'}</button>
        </div>
        <div className="p-5 md:p-6">
          {!settings?.hasApiKey && <Status type="info" message="Add and verify a Gemini API key above before running the first analysis." />}
          <Status message={analysisStatus?.message} type={analysisStatus?.type} />
          {!result && !analyzing && <div className="py-10 text-center"><BrainCircuit className="h-8 w-8 text-slate-200 mx-auto" /><div className="mt-3 text-[12px] text-slate-400">Your AI-generated draft will appear here for review.</div></div>}
          {analyzing && <div className="py-12 text-center"><div className="mx-auto h-14 w-14 rounded-2xl border border-blue-100 bg-blue-50 flex items-center justify-center"><BrainCircuit className="h-6 w-6 text-blue-600 animate-pulse" /></div><div className="mt-4 text-[13px] font-medium text-slate-800">Reading the complete project package</div><div className="mt-1 text-[10.5px] text-slate-400">Large PDFs and workbooks can take a little longer.</div></div>}
          {result && <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"><Field label="Project title"><input value={result.title || ''} onChange={(event) => update('title', event.target.value)} className={inputClass} /></Field><Field label="Category"><select value={result.category || CATEGORIES[0]} onChange={(event) => update('category', event.target.value)} className={inputClass}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Industry"><input value={result.industry || ''} onChange={(event) => update('industry', event.target.value)} className={inputClass} /></Field><Field label="Year"><input type="number" value={result.year || new Date().getFullYear()} onChange={(event) => update('year', Number(event.target.value))} className={inputClass} /></Field></div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><Field label="Executive summary"><textarea rows={5} value={result.executiveSummary || ''} onChange={(event) => update('executiveSummary', event.target.value)} className={`${inputClass} resize-y`} /></Field><Field label="Business problem / objective"><textarea rows={5} value={result.problem || ''} onChange={(event) => update('problem', event.target.value)} className={`${inputClass} resize-y`} /></Field></div>
            <Field label="Impact / headline deliverable"><input value={result.impact || ''} onChange={(event) => update('impact', event.target.value)} className={inputClass} /></Field>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><Field label="Approach — one step per line"><textarea rows={7} value={(result.approach || []).join('\n')} onChange={(event) => update('approach', arrayFromText(event.target.value.replace(/,/g, '‚')))} className={`${inputClass} resize-y`} /></Field><Field label="Deliverables — one per line"><textarea rows={7} value={(result.deliverables || []).join('\n')} onChange={(event) => update('deliverables', arrayFromText(event.target.value.replace(/,/g, '‚')))} className={`${inputClass} resize-y`} /></Field></div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><Field label="Tools — comma separated"><input value={(result.tools || []).join(', ')} onChange={(event) => update('tools', arrayFromText(event.target.value))} className={inputClass} /></Field><Field label="Tags — comma separated"><input value={(result.tags || []).join(', ')} onChange={(event) => update('tags', arrayFromText(event.target.value))} className={inputClass} /></Field></div>
            <Field label="Capability demonstrated"><textarea rows={3} value={result.learnings || ''} onChange={(event) => update('learnings', event.target.value)} className={`${inputClass} resize-y`} /></Field>
            {(result.evidence || []).length > 0 && <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"><div className="px-4 py-3 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">AI evidence trail</div><div className="divide-y divide-slate-200">{result.evidence.map((item, index) => <div key={`${item.field}-${index}`} className="px-4 py-3 grid grid-cols-1 md:grid-cols-[120px_170px_1fr] gap-2 text-[10.5px]"><div className="font-medium text-blue-700">{item.field}</div><div className="text-slate-500 truncate">{item.source}</div><div className="text-slate-700">{item.finding}</div></div>)}</div></div>}
            {(result.analysisNotes || []).length > 0 && <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><div className="text-[10px] uppercase tracking-widest text-amber-700">Review notes</div><ul className="mt-2 space-y-1.5">{result.analysisNotes.map((note, index) => <li key={index} className="text-[10.5px] text-amber-800 flex gap-2"><span>•</span><span>{note}</span></li>)}</ul></div>}
          </div>}
        </div>
      </section>

      {result && <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="text-[10px] uppercase tracking-[.16em] text-blue-600">Step 3</div><h2 className="mt-1 text-[17px] font-semibold text-slate-950">Publish to the main portfolio</h2><p className="mt-1 text-[10.5px] text-slate-500">Creates the live project card, detail modal, thumbnail and attached-file links.</p></div><div className="flex gap-2 flex-wrap"><button onClick={resetDraft} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"><Plus className="h-4 w-4" /> New draft</button><button onClick={publish} disabled={publishing || !result.title?.trim()} className="h-11 rounded-xl bg-blue-600 px-5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}{publishing ? 'Publishing…' : 'Publish project'}</button></div></section>}
      <Status message={publishStatus?.message} type={publishStatus?.type} />
    </div>
  )
}
