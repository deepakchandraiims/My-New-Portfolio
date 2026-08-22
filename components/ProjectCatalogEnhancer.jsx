'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, X } from 'lucide-react'
import { RECRUITER_PROJECTS } from '@/lib/recruiter-projects'

const CATEGORY_ORDER = [
  'Private Equity',
  'Investment Banking / M&A',
  'Special Situations / Distressed',
  'Hedge Fund',
  'Private Credit',
  'Growth Equity',
]

function ProjectModal({ project, onClose }) {
  if (!project || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[190] bg-slate-950/50 backdrop-blur-sm p-3 md:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 md:p-7 border-b border-slate-100 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[.18em] text-blue-600">{project.category}</div>
            <h3 className="mt-2 text-[24px] md:text-[30px] font-semibold tracking-tight text-slate-950 leading-tight">{project.title}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{project.executiveSummary}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 md:p-7 grid grid-cols-1 md:grid-cols-[1.4fr_.9fr] gap-7">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">What the project demonstrates</div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-700">{project.problem}</p>
            <div className="mt-6 text-[10px] uppercase tracking-widest text-slate-400">Approach</div>
            <div className="mt-3 space-y-2">{(project.approach || []).map((step, i) => <div key={i} className="flex gap-3 text-[12.5px] text-slate-700"><span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] shrink-0">{i + 1}</span><span>{step}</span></div>)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Deliverables</div>
            <div className="mt-3 space-y-2">{(project.deliverables || []).map((d) => <div key={d} className="flex items-start gap-2 text-[11.5px] text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />{d}</div>)}</div>
            <div className="mt-6 text-[10px] uppercase tracking-widest text-slate-400">Tools</div>
            <div className="mt-2 flex flex-wrap gap-1.5">{(project.tools || []).map((t) => <span key={t} className="text-[10.5px] px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600">{t}</span>)}</div>
            <div className="mt-6 text-[10px] uppercase tracking-widest text-slate-400">Capability gained</div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-700">{project.learnings}</p>
          </div>
        </div>
      </div>
    </div>, document.body,
  )
}

export default function ProjectCatalogEnhancer() {
  const [mount, setMount] = useState(null)
  const [projects, setProjects] = useState(RECRUITER_PROJECTS)
  const [activeCategory, setActiveCategory] = useState('Private Equity')
  const [activeProject, setActiveProject] = useState(null)

  useEffect(() => {
    let cancelled = false
    const section = document.getElementById('work')
    if (!section) return
    section.classList.add('project-catalog-active')
    const node = document.createElement('div')
    node.className = 'project-catalog-root'
    section.appendChild(node)
    setMount(node)
    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !Array.isArray(data?.projects)) return
        const next = data.projects.filter((p) => !p.hidden)
        const isNewCatalog = CATEGORY_ORDER.every((c) => next.some((p) => p.category === c)) && next.length >= 30
        if (isNewCatalog) setProjects(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      section.classList.remove('project-catalog-active')
      node.remove()
    }
  }, [])

  const categories = useMemo(() => CATEGORY_ORDER.filter((c) => projects.some((p) => p.category === c)), [projects])
  const visible = useMemo(() => projects.filter((p) => p.category === activeCategory), [projects, activeCategory])

  if (!mount) return null
  return createPortal(
    <>
      <style jsx global>{`
        #work.project-catalog-active > *:not(.project-catalog-root){display:none!important}
        #work.project-catalog-active{padding-top:2.25rem!important;padding-bottom:2.75rem!important}
      `}</style>
      <div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2"><span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><BriefcaseBusiness className="h-3.5 w-3.5 text-blue-600" /></span><h2 className="text-[14px] md:text-[15px] font-semibold uppercase tracking-[.12em] text-slate-700">Institutional Finance Projects</h2></div>
            <p className="mt-2 text-[11px] text-slate-500">30 projects across six buy-side and advisory disciplines · 5 projects per category</p>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-blue-600">Select a category</div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {categories.map((c) => <button key={c} onClick={() => setActiveCategory(c)} className={`shrink-0 rounded-full px-3 py-2 text-[10.5px] border transition ${activeCategory === c ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-700'}`}>{c}</button>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {visible.map((p, idx) => <button key={p.id} onClick={() => setActiveProject(p)} className="text-left rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/30 transition overflow-hidden group">
            <div className="h-28 bg-gradient-to-br from-blue-50 to-slate-100 relative flex items-center justify-center">
              <div className="text-[48px] font-serif text-blue-900/[.07]">{String(idx + 1).padStart(2, '0')}</div>
              <span className="absolute top-2.5 left-2.5 text-[8.5px] uppercase tracking-widest bg-white/90 border border-blue-100 rounded px-2 py-1 text-blue-700">{p.category}</span>
            </div>
            <div className="p-4">
              <div className="text-[13.5px] font-semibold leading-snug text-slate-900 min-h-[54px]">{p.title}</div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500 line-clamp-3">{p.executiveSummary}</p>
              <div className="mt-3 flex gap-1 flex-wrap">{(p.tools || []).slice(0, 3).map((t) => <span key={t} className="text-[8.5px] px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500">{t}</span>)}</div>
              <div className="mt-4 text-[9.5px] uppercase tracking-widest text-blue-600 flex items-center gap-1">View project <ArrowRight className="h-3 w-3" /></div>
            </div>
          </button>)}
        </div>
      </div>
      {activeProject && <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />}
    </>, mount,
  )
}
