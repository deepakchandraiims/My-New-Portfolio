'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Award, CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react'

const CERTS = [
  ['wharton-finance-quant','Finance & Quantitative Modeling for Analysts'],
  ['jobaaj-soft-skills','Communication / Soft Skills'],
  ['jobaaj-advanced-modeling','Advanced Modelling'],
  ['jobaaj-equity-research','How to Build an Equity Research Report'],
  ['jobaaj-genai','Artificial Intelligence & Generative AI'],
  ['jobaaj-excel-mastery','Microsoft Excel Complete Mastery'],
  ['jobaaj-investment-banking','Investment Banking Overview'],
  ['jobaaj-financial-modeling-valuation','Financial Modelling & Valuations'],
  ['oracle-otbi','Oracle Fusion Smart View / Financial Reporting Studio / OTBI'],
  ['jpmorgan-commercial-banking','Commercial Banking Job Simulation'],
  ['linkedin-data-analyst','Become a Data Analyst'],
  ['learnvern-excel','MS Excel'],
  ['cfi-corporate-finance','CFI Corporate Finance Foundations Professional Certificate'],
  ['microsoft-project-management','Career Essentials in Project Management'],
  ['coursera-stock-valuation','Stock Valuation with Comparable Companies Analysis'],
].map(([slug,name])=>({slug,name}))

const TOKEN_KEY='portfolio_admin_token'

function uploadFile(file,label,token,onProgress){
  return new Promise((resolve,reject)=>{
    const form=new FormData(); form.append('file',file); form.append('label',label)
    const xhr=new XMLHttpRequest(); xhr.open('POST','/api/files/upload'); if(token) xhr.setRequestHeader('x-admin-token',token)
    xhr.upload.onprogress=(e)=>{ if(e.lengthComputable) onProgress?.(Math.round(e.loaded/e.total*100)) }
    xhr.onload=()=>{ let d={}; try{d=JSON.parse(xhr.responseText||'{}')}catch{}; if(xhr.status>=200&&xhr.status<300&&d.file) resolve(d.file); else reject(new Error(d.error||`HTTP ${xhr.status}`)) }
    xhr.onerror=()=>reject(new Error('Network error')); xhr.send(form)
  })
}

export default function CertificateUploadDrawer(){
  const [navHost,setNavHost]=useState(null)
  const [open,setOpen]=useState(false)
  const [content,setContent]=useState(null)
  const [busy,setBusy]=useState('')
  const [status,setStatus]=useState('')
  const [progress,setProgress]=useState({})

  useEffect(()=>{
    const attach=()=>{
      const nav=document.querySelector('.admin-dashboard-shell aside nav')
      if(!nav) return false
      let host=nav.querySelector('[data-certificate-upload-launcher="true"]')
      if(!host){ host=document.createElement('div'); host.dataset.certificateUploadLauncher='true'; nav.appendChild(host) }
      setNavHost(host); return true
    }
    if(attach()) return
    const t=setInterval(()=>{if(attach()) clearInterval(t)},250)
    return()=>clearInterval(t)
  },[])

  useEffect(()=>{ if(open) fetch('/api/content',{cache:'no-store'}).then(r=>r.json()).then(setContent).catch(()=>setStatus('Could not load certificate data.')) },[open])
  const docs=content?.certificateDocuments||{}
  const attached=useMemo(()=>Object.values(docs).filter(x=>x?.url).length,[docs])

  async function save(nextDocs){
    const token=localStorage.getItem(TOKEN_KEY)||''
    const next={...content,certificateDocuments:nextDocs}
    const r=await fetch('/api/content',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-token':token},body:JSON.stringify(next)})
    if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error||`HTTP ${r.status}`)
    setContent(next)
  }

  async function onUpload(cert,file){
    if(!file) return
    const token=localStorage.getItem(TOKEN_KEY)||''
    setBusy(cert.slug); setStatus('')
    try{
      const up=await uploadFile(file,cert.name,token,p=>setProgress(v=>({...v,[cert.slug]:p})))
      const nextDocs={...docs,[cert.slug]:{url:up.publicUrl,mimeType:up.mimeType||file.type,fileName:up.originalName||file.name,uploadedAt:new Date().toISOString()}}
      await save(nextDocs)
      setStatus(`${cert.name} uploaded to Supabase. The live portfolio will use this exact file.`)
    }catch(e){setStatus(`Upload failed: ${e.message||e}`)}finally{setBusy('')}
  }

  return <>
    {navHost&&createPortal(<button onClick={()=>setOpen(true)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-slate-300 hover:bg-white/[.06] hover:text-white transition"><Award className="h-4 w-4"/><span className="flex-1">Certificate Files</span><span className="text-[9px] text-slate-500">Supabase</span></button>,navHost)}
    {open&&typeof document!=='undefined'&&createPortal(<div className="fixed inset-0 z-[210] bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}>
      <div className="absolute inset-y-0 right-0 w-full max-w-[680px] bg-[#f8fafc] shadow-2xl border-l border-slate-200 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center"><Award className="h-4 w-4 text-blue-600"/></div>
          <div className="flex-1"><h2 className="text-[18px] font-semibold text-slate-950">Certificate Files</h2><p className="mt-0.5 text-[11px] text-slate-500">Upload the original PDF/JPG/PNG. Files are stored in Supabase and the public portfolio renders the original file, not a generated preview.</p></div>
          <button onClick={()=>setOpen(false)} className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between"><div className="text-[11px] text-blue-800">Original certificate files connected</div><div className="text-[12px] font-semibold text-blue-700">{attached}/15</div></div>
          {!content?<div className="py-12 text-center text-slate-400 text-[12px]"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2"/>Loading…</div>:<div className="space-y-2">{CERTS.map(cert=>{const doc=docs[cert.slug]; const p=progress[cert.slug]; return <div key={cert.slug} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${doc?.url?'bg-emerald-50 text-emerald-600':'bg-slate-50 text-slate-400'}`}>{doc?.url?<CheckCircle2 className="h-4 w-4"/>:<FileText className="h-4 w-4"/>}</div>
            <div className="flex-1 min-w-0"><div className="text-[11.5px] font-medium text-slate-800 truncate">{cert.name}</div><div className="mt-0.5 text-[9.5px] text-slate-400 truncate">{busy===cert.slug?`Uploading ${p||0}%`:doc?.fileName||'No original file uploaded yet'}</div></div>
            {doc?.url&&<a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline">Open</a>}
            <label className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10.5px] font-medium cursor-pointer ${busy?'bg-slate-100 text-slate-400':'bg-blue-600 text-white hover:bg-blue-700'}`}><UploadCloud className="h-3.5 w-3.5"/>{doc?.url?'Replace':'Upload'}<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" disabled={!!busy} onChange={e=>{onUpload(cert,e.target.files?.[0]);e.target.value=''}}/></label>
          </div>})}</div>}
          {status&&<div className={`mt-4 rounded-lg px-3 py-2 text-[11px] ${/failed/i.test(status)?'bg-red-50 text-red-600':'bg-emerald-50 text-emerald-700'}`}>{status}</div>}
        </div>
      </div>
    </div>,document.body)}
  </>
}
