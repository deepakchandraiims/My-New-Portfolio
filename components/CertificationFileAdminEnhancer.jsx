'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { unzipSync } from 'fflate'
import { CheckCircle2, FileArchive, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react'

const CERTS = [
  ['wharton-finance-quant', 'Finance & Quantitative Modeling for Analysts'],
  ['jobaaj-soft-skills', 'Communication / Soft Skills'],
  ['jobaaj-advanced-modeling', 'Advanced Modelling'],
  ['jobaaj-equity-research', 'How to Build an Equity Research Report'],
  ['jobaaj-genai', 'Artificial Intelligence & Generative AI'],
  ['jobaaj-excel-mastery', 'Microsoft Excel Complete Mastery'],
  ['jobaaj-investment-banking', 'Investment Banking Overview'],
  ['jobaaj-financial-modeling-valuation', 'Financial Modelling & Valuations'],
  ['oracle-otbi', 'Oracle Fusion Smart View / Financial Reporting Studio / OTBI'],
  ['jpmorgan-commercial-banking', 'Commercial Banking Job Simulation'],
  ['linkedin-data-analyst', 'Become a Data Analyst'],
  ['learnvern-excel', 'MS Excel'],
  ['cfi-corporate-finance', 'CFI Corporate Finance Foundations Professional Certificate'],
  ['microsoft-project-management', 'Career Essentials in Project Management'],
  ['coursera-stock-valuation', 'Stock Valuation with Comparable Companies Analysis'],
].map(([slug, name]) => ({ slug, name }))

function mimeFor(name) {
  const n = name.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function matchCertificate(path) {
  const n = path.toLowerCase().replace(/\\/g, '/')
  const base = n.split('/').pop() || n

  if (base.includes('data analyst certificate')) return 'linkedin-data-analyst'
  if (base.includes('j6bavusxuxbq')) return 'coursera-stock-valuation'
  if (base.includes('certificate_ms excel')) return 'learnvern-excel'
  if (base.includes('career essentials in project management')) return 'microsoft-project-management'
  if (base.includes('jp morgan job simulation')) return 'jpmorgan-commercial-banking'
  if (base.includes('cfi corporate finance foundations')) return 'cfi-corporate-finance'
  if (base.includes('finance & quantitative modeling for analysts')) return 'wharton-finance-quant'
  if (base.includes('oracle otbi')) return 'oracle-otbi'

  if (base === 'jobaajlearnings-certificate.jpg' || base === 'jobaajlearnings-certificate.jpeg') return 'jobaaj-investment-banking'
  if (/jobaajlearnings-certificate \(1\)\./.test(base)) return 'jobaaj-excel-mastery'
  if (/jobaajlearnings-certificate \(2\)\./.test(base)) return 'jobaaj-financial-modeling-valuation'
  if (/jobaajlearnings-certificate \(3\)\./.test(base)) return 'jobaaj-advanced-modeling'
  if (/jobaajlearnings-certificate \(4\)\./.test(base)) return 'jobaaj-genai'
  if (/jobaajlearnings-certificate \(5\)\./.test(base)) return 'jobaaj-equity-research'
  if (/jobaajlearnings-certificate \(6\)\./.test(base)) return 'jobaaj-soft-skills'
  return null
}

function uploadOne(file, label, token, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('label', label)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/files/upload')
    if (token) xhr.setRequestHeader('x-admin-token', token)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let payload = {}
      try { payload = JSON.parse(xhr.responseText || '{}') } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && payload.file) resolve(payload.file)
      else reject(new Error(payload.error || `HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(form)
  })
}

export default function CertificationFileAdminEnhancer() {
  const [target, setTarget] = useState(null)
  const [content, setContent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState({})

  useEffect(() => {
    const attach = () => {
      const marker = [...document.querySelectorAll('div')].find((el) => el.childElementCount === 0 && el.textContent?.trim() === 'Professional credentials and coursework.')
      if (!marker?.parentElement) return false
      let mount = document.getElementById('certificate-file-admin-mount')
      if (!mount) {
        mount = document.createElement('div')
        mount.id = 'certificate-file-admin-mount'
        mount.className = 'mb-6'
        marker.parentElement.insertBefore(mount, marker.nextSibling)
      }
      setTarget(mount)
      return true
    }
    if (attach()) return
    const timer = setInterval(attach, 250)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!target) return
    fetch('/api/content').then((r) => r.json()).then(setContent).catch(() => {})
  }, [target])

  const documents = content?.certificateDocuments || {}
  const attachedCount = useMemo(() => Object.keys(documents).filter((k) => documents[k]?.url).length, [documents])

  async function saveDocuments(nextDocs) {
    const token = localStorage.getItem('portfolio_admin_token') || ''
    const next = { ...content, certificateDocuments: nextDocs }
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) },
      body: JSON.stringify(next),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
    setContent(next)
  }

  async function importZip(zipFile) {
    if (!zipFile) return
    setBusy(true); setStatus('Reading ZIP…'); setProgress({})
    try {
      const bytes = new Uint8Array(await zipFile.arrayBuffer())
      const archive = unzipSync(bytes)
      const matched = []
      for (const [path, data] of Object.entries(archive)) {
        if (!data?.length || path.endsWith('/')) continue
        const slug = matchCertificate(path)
        if (!slug) continue
        const cert = CERTS.find((c) => c.slug === slug)
        if (!cert) continue
        const originalName = path.split('/').pop()
        matched.push({ slug, cert, file: new File([data], originalName, { type: mimeFor(originalName) }) })
      }
      if (!matched.length) throw new Error('No matching certificate files were found in this ZIP.')

      const token = localStorage.getItem('portfolio_admin_token') || ''
      const nextDocs = { ...(content?.certificateDocuments || {}) }
      let done = 0
      for (const item of matched) {
        setStatus(`Uploading ${done + 1} of ${matched.length}: ${item.cert.name}`)
        const uploaded = await uploadOne(item.file, item.cert.name, token, (pct) => setProgress((p) => ({ ...p, [item.slug]: pct })))
        nextDocs[item.slug] = {
          url: uploaded.publicUrl,
          mimeType: uploaded.mimeType || item.file.type,
          fileName: uploaded.originalName || item.file.name,
          uploadedAt: new Date().toISOString(),
        }
        done += 1
      }
      setStatus('Saving certificate links…')
      await saveDocuments(nextDocs)
      setStatus(`${matched.length} real certificate files attached successfully.`)
    } catch (e) {
      setStatus(`Import failed: ${e.message || e}`)
    } finally { setBusy(false) }
  }

  async function uploadSingle(slug, file) {
    if (!file) return
    const cert = CERTS.find((c) => c.slug === slug)
    const token = localStorage.getItem('portfolio_admin_token') || ''
    setBusy(true); setStatus(`Uploading ${cert?.name || file.name}…`)
    try {
      const uploaded = await uploadOne(file, cert?.name || file.name, token, (pct) => setProgress((p) => ({ ...p, [slug]: pct })))
      const nextDocs = {
        ...(content?.certificateDocuments || {}),
        [slug]: { url: uploaded.publicUrl, mimeType: uploaded.mimeType || file.type, fileName: uploaded.originalName || file.name, uploadedAt: new Date().toISOString() },
      }
      await saveDocuments(nextDocs)
      setStatus('Certificate attached. The public card now uses the real file.')
    } catch (e) { setStatus(`Upload failed: ${e.message || e}`) } finally { setBusy(false) }
  }

  async function remove(slug) {
    const nextDocs = { ...(content?.certificateDocuments || {}) }
    delete nextDocs[slug]
    setBusy(true)
    try { await saveDocuments(nextDocs); setStatus('Certificate file detached.') }
    catch (e) { setStatus(`Could not detach: ${e.message || e}`) }
    finally { setBusy(false) }
  }

  if (!target || !content) return null

  return createPortal(
    <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileArchive className="h-4 w-4 text-blue-600" /> Real certificate files</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-2xl">Import the original certificate ZIP once. PDFs remain PDFs, image certificates remain full-resolution images, and the public cards automatically use the real files instead of preview-only artwork.</p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-white text-blue-700">{attachedCount}/15 attached</div>
      </div>

      <label className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${busy ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {busy ? 'Importing…' : 'Import certificate ZIP'}
        <input type="file" accept=".zip,application/zip" className="hidden" disabled={busy} onChange={(e) => { importZip(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {status && <div className={`mt-3 text-xs ${status.includes('failed') || status.includes('Could not') ? 'text-red-600' : 'text-slate-600'}`}>{status}</div>}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-2">
        {CERTS.map((cert) => {
          const doc = documents[cert.slug]
          const pct = progress[cert.slug]
          return (
            <div key={cert.slug} className="rounded-xl border border-slate-200 bg-white px-3 py-3 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${doc?.url ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {doc?.url ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-slate-800 truncate">{cert.name}</div>
                <div className="mt-0.5 text-[10px] text-slate-400 truncate">{doc?.fileName || (pct ? `Uploading ${pct}%` : 'No real file attached')}</div>
              </div>
              <label className="text-[10px] px-2 py-1 rounded-md border border-slate-200 text-blue-600 hover:bg-blue-50 cursor-pointer shrink-0">
                {doc?.url ? 'Replace' : 'Upload'}
                <input type="file" accept="application/pdf,image/*" className="hidden" disabled={busy} onChange={(e) => { uploadSingle(cert.slug, e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {doc?.url && <button type="button" onClick={() => remove(cert.slug)} disabled={busy} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          )
        })}
      </div>
    </section>,
    target,
  )
}
