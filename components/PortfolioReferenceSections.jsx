'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight, Award, BadgeCheck, BarChart3, BookOpen, BriefcaseBusiness,
  CheckCircle2, ExternalLink, FileText, Layers3, LineChart, ShieldCheck,
  Sparkles, Wrench,
} from 'lucide-react'

const unique = (items) => [...new Set((items || []).filter(Boolean))]

function SectionHeading({ icon: Icon, eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-blue-600 font-medium">
          <span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><Icon className="h-3.5 w-3.5" /></span>
          {eyebrow}
        </div>
        <h2 className="mt-3 text-[25px] md:text-[32px] font-semibold tracking-tight text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function ToolTile({ name }) {
  const initials = String(name || '').split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 3).join('').toUpperCase()
  return (
    <div className="group rounded-xl border border-slate-200 bg-white px-3 py-3 hover:border-blue-200 hover:shadow-[0_12px_30px_-24px_rgba(37,99,235,.7)] transition-all">
      <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-blue-700 group-hover:bg-blue-50 group-hover:border-blue-100 transition">{initials || '•'}</div>
      <div className="mt-2 text-[11.5px] font-medium text-slate-800 leading-tight">{name}</div>
    </div>
  )
}

function openProjectByTitle(title) {
  const root = document.getElementById('work')
  if (!root) return
  const buttons = [...root.querySelectorAll('button')]
  const hit = buttons.find((b) => (b.textContent || '').toLowerCase().includes(String(title || '').toLowerCase()))
  if (hit) hit.click()
  else root.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function PortfolioReferenceSections() {
  const [host, setHost] = useState(null)
  const [content, setContent] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/content')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) setContent(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const main = document.querySelector('main')
    const experience = document.getElementById('experience')
    if (!main || !experience) return undefined

    let node = main.querySelector('[data-reference-sections-host="true"]')
    let created = false
    if (!node) {
      node = document.createElement('div')
      node.dataset.referenceSectionsHost = 'true'
      experience.insertAdjacentElement('afterend', node)
      created = true
    }
    setHost(node)
    return () => {
      setHost(null)
      if (created && node?.isConnected) node.remove()
    }
  }, [])

  const model = useMemo(() => {
    if (!content) return null
    const skills = content.skills || []
    const finance = skills.find((g) => /finance|valuation/i.test(g.group || ''))?.items || skills[0]?.items || []
    const strategy = skills.find((g) => /strategy|research/i.test(g.group || ''))?.items || skills[1]?.items || []
    const data = skills.find((g) => /data|engineering|tool/i.test(g.group || ''))?.items || []
    const projectTools = (content.projects || []).flatMap((p) => p.tools || [])
    const tools = unique((content.tools && content.tools.length ? content.tools : [...data, ...projectTools])).slice(0, 12)
    const expertise = unique([...(content.expertise || []), ...strategy]).slice(0, 14)
    const certifications = (content.certifications || []).slice(0, 8)
    const insights = (content.projects || [])
      .filter((p) => !p.hidden)
      .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
      .slice(0, 4)
    return { finance: finance.slice(0, 9), tools, expertise, certifications, insights }
  }, [content])

  if (!host || !model) return null

  return createPortal(
    <div className="reference-portfolio-sections">
      <section id="skills-tools" className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 border-t border-slate-100">
        <SectionHeading icon={Wrench} eyebrow="Skills & tools" title="Execution stack. Built for finance work that has to survive review." />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.18fr_1.15fr] gap-4">
          <div className="reference-panel p-5 md:p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.16em] font-medium text-blue-700"><LineChart className="h-4 w-4" /> Financial skills</div>
            <div className="mt-4 space-y-2.5">
              {model.finance.map((skill) => (
                <div key={skill} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-[12px] text-slate-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reference-panel p-5 md:p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.16em] font-medium text-blue-700"><Layers3 className="h-4 w-4" /> Tools & platforms</div>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {model.tools.map((tool) => <ToolTile key={tool} name={tool} />)}
            </div>
          </div>

          <div className="reference-panel p-5 md:p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.16em] font-medium text-blue-700"><ShieldCheck className="h-4 w-4" /> Expertise areas</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {model.expertise.map((item) => (
                <span key={item} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11.5px] text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 transition">{item}</span>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-blue-50/70 border border-blue-100 p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium text-blue-800"><Sparkles className="h-3.5 w-3.5" /> Working style</div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">Model first, source-backed assumptions, decision-ready output, and automation where it removes repetitive analyst work.</p>
            </div>
          </div>
        </div>
      </section>

      {model.certifications.length > 0 && (
        <section id="certifications" className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 border-t border-slate-100">
          <SectionHeading
            icon={Award}
            eyebrow="Certificates"
            title="Credentials that support the operating toolkit."
            action={<a href="#certifications" className="text-[12px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">View credentials <ArrowRight className="h-3.5 w-3.5" /></a>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {model.certifications.map((cert) => (
              <div key={cert.id || cert.name} className="reference-panel p-5 flex flex-col min-h-[180px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center"><BadgeCheck className="h-5 w-5 text-blue-600" /></div>
                  {cert.year && <span className="text-[10px] uppercase tracking-widest text-slate-400">{cert.year}</span>}
                </div>
                <div className="mt-4 text-[11px] text-slate-500">{cert.issuer}</div>
                <div className="mt-1 text-[15px] font-semibold leading-snug text-slate-900">{cert.name}</div>
                <div className="mt-auto pt-5">
                  {cert.credentialUrl ? (
                    <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-blue-600 hover:text-blue-700">Verify credential <ExternalLink className="h-3.5 w-3.5" /></a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"><CheckCircle2 className="h-3.5 w-3.5" /> Credential listed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {model.insights.length > 0 && (
        <section id="insights" className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 border-t border-slate-100">
          <SectionHeading
            icon={BookOpen}
            eyebrow="Insights & research"
            title="Selected work, surfaced like an analyst research shelf."
            action={<a href="#work" className="text-[12px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">View all projects <ArrowRight className="h-3.5 w-3.5" /></a>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.insights.map((p, i) => (
              <button key={p.id} onClick={() => openProjectByTitle(p.title)} className="reference-panel p-5 md:p-6 text-left group hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-blue-700"><FileText className="h-3.5 w-3.5" /> {p.category || 'Research'}</span>
                  <span className="text-[10px] text-slate-400">{p.year}{p.readingMinutes ? ` · ${p.readingMinutes} min read` : ''}</span>
                </div>
                <div className="mt-3 text-[16px] md:text-[17px] font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition">{p.title}</div>
                <p className="mt-2 text-[12px] text-slate-500 leading-relaxed line-clamp-2">{p.executiveSummary || p.impact}</p>
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {(p.tools || []).slice(0, 4).map((tool) => <span key={tool} className="text-[10px] px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">{tool}</span>)}
                </div>
                <div className="mt-5 inline-flex items-center gap-1 text-[11.5px] font-medium text-blue-600">View case study <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" /></div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>,
    host,
  )
}
