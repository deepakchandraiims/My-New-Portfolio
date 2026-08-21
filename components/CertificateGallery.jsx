'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Award, BadgeCheck, ExternalLink, Search, Sparkles, Wrench } from 'lucide-react'

const CERTIFICATES = [
  {
    id: 'wharton-finance-quant',
    name: 'Finance & Quantitative Modeling for Analysts',
    issuer: 'Wharton Online · University of Pennsylvania · Coursera',
    year: 2025,
    category: 'Finance & Modeling',
    gained: 'Built a stronger foundation in spreadsheet modeling, quantitative analysis, forecasting and interpreting financial information for business decisions.',
    skills: ['Financial Modeling', 'Spreadsheets', 'Forecasting', 'Quantitative Analysis'],
    tools: ['Excel'],
    keywords: ['Wharton', 'Finance', 'Modeling', 'Analyst', 'Forecasting'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-soft-skills',
    name: 'Communication / Soft Skills',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'Professional Skills',
    gained: 'Improved structured communication, stakeholder interaction, professional presence and the ability to present analysis clearly to non-technical audiences.',
    skills: ['Business Communication', 'Stakeholder Management', 'Presentation', 'Professional Communication'],
    tools: [],
    keywords: ['Communication', 'Stakeholders', 'Presentation', 'Leadership'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-advanced-modeling',
    name: 'Advanced Modelling',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'Finance & Modeling',
    gained: 'Strengthened model architecture, assumption building, scenario analysis and structured financial-model workflows for decision support.',
    skills: ['Financial Modeling', 'Scenario Analysis', 'Sensitivity Analysis', 'Forecasting'],
    tools: ['Excel'],
    keywords: ['Advanced Modeling', 'Forecast', 'Scenario', 'Sensitivity'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-equity-research',
    name: 'How to Build an Equity Research Report',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'Investment Research',
    gained: 'Learned to structure an equity-research report from business overview and industry analysis through forecasts, valuation, risks and investment conclusion.',
    skills: ['Equity Research', 'Company Analysis', 'Valuation', 'Investment Thesis'],
    tools: ['Excel', 'PowerPoint'],
    keywords: ['Equity Research', 'Valuation', 'Investment Thesis', 'Research Report'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-genai',
    name: 'Artificial Intelligence & Generative AI',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'AI & Technology',
    gained: 'Developed working knowledge of generative-AI concepts, prompt-driven workflows and practical ways to augment research, analysis and productivity.',
    skills: ['Generative AI', 'Prompt Engineering', 'AI Workflows', 'Research Automation'],
    tools: ['ChatGPT / LLMs'],
    keywords: ['GenAI', 'LLM', 'Prompt Engineering', 'Automation', 'AI for Finance'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-excel-mastery',
    name: 'Microsoft Excel Complete Mastery',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'Data & BI',
    gained: 'Deepened spreadsheet productivity, formula design, data handling and model-building capability for finance and analytical work.',
    skills: ['Advanced Excel', 'Data Analysis', 'Spreadsheet Modeling', 'Reporting'],
    tools: ['Microsoft Excel'],
    keywords: ['Excel', 'Modeling', 'Analysis', 'Reporting'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-investment-banking',
    name: 'Investment Banking Overview',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'Investment Banking',
    gained: 'Built an end-to-end view of investment-banking workflows including transaction process, valuation, deal materials and execution fundamentals.',
    skills: ['Investment Banking', 'M&A Process', 'Valuation', 'Deal Execution'],
    tools: ['Excel', 'PowerPoint'],
    keywords: ['Investment Banking', 'M&A', 'Valuation', 'Deal Execution'],
    credentialUrl: '',
  },
  {
    id: 'jobaaj-financial-modeling-valuation',
    name: 'Financial Modelling & Valuations',
    issuer: 'Jobaaj Learnings',
    year: 2025,
    category: 'Finance & Modeling',
    gained: 'Strengthened the link between operating assumptions, financial statements and valuation outputs for investment and corporate-finance decisions.',
    skills: ['Financial Modeling', 'Valuation', 'DCF', 'Financial Statement Analysis'],
    tools: ['Excel'],
    keywords: ['DCF', 'Valuation', 'Financial Modeling', 'Corporate Finance'],
    credentialUrl: '',
  },
  {
    id: 'oracle-otbi',
    name: 'Oracle Fusion Smart View / Financial Reporting Studio / OTBI',
    issuer: 'Udemy',
    year: 2024,
    category: 'Data & BI',
    gained: 'Learned Oracle Fusion reporting workflows for financial analysis, Smart View, Financial Reporting Studio and Oracle Transactional Business Intelligence.',
    skills: ['Financial Reporting', 'BI Reporting', 'ERP Analytics', 'Management Reporting'],
    tools: ['Oracle Fusion', 'Smart View', 'OTBI', 'Financial Reporting Studio'],
    keywords: ['Oracle', 'OTBI', 'Smart View', 'ERP', 'Reporting'],
    credentialUrl: 'https://ude.my/UC-c59bf1e9-fdf2-465c-a9db-78df77ed8546',
  },
  {
    id: 'jpmorgan-commercial-banking',
    name: 'Commercial Banking Job Simulation',
    issuer: 'JPMorgan Chase & Co. · Forage',
    year: 2024,
    category: 'Banking & Credit',
    gained: 'Completed practical work covering financial statements, capitalization tables, company and industry overview, deal structure and a 10-year financial forecast.',
    skills: ['Financial Statement Analysis', 'Capitalization Tables', 'Deal Structuring', 'Financial Forecasting'],
    tools: ['Excel'],
    keywords: ['JPMorgan', 'Commercial Banking', 'Credit', 'Deal Structure', 'Forecasting'],
    credentialUrl: '',
  },
  {
    id: 'linkedin-data-analyst',
    name: 'Become a Data Analyst',
    issuer: 'LinkedIn Learning',
    year: 2024,
    category: 'Data & BI',
    gained: 'Built practical analyst capability across data preparation, visualization and business reporting with a focus on turning raw data into decision-ready insights.',
    skills: ['Data Analysis', 'Data Visualization', 'Dashboarding', 'Business Intelligence'],
    tools: ['Tableau', 'Power BI', 'Microsoft Excel'],
    keywords: ['Data Analyst', 'Tableau', 'Power BI', 'Excel', 'BI'],
    credentialUrl: '',
  },
  {
    id: 'learnvern-excel',
    name: 'MS Excel',
    issuer: 'LearnVern',
    year: 2024,
    category: 'Data & BI',
    gained: 'Developed practical spreadsheet skills for data organization, formulas, analysis, reporting and finance-oriented model work.',
    skills: ['Excel', 'Spreadsheet Analysis', 'Reporting', 'Data Handling'],
    tools: ['Microsoft Excel'],
    keywords: ['Excel', 'Spreadsheet', 'Reporting', 'Analysis'],
    credentialUrl: 'https://www.learnvern.com/certificate',
  },
  {
    id: 'cfi-corporate-finance',
    name: 'CFI Corporate Finance Foundations Professional Certificate',
    issuer: 'Corporate Finance Institute · LinkedIn Learning',
    year: 2024,
    category: 'Finance & Modeling',
    gained: 'Reinforced corporate-finance fundamentals, financial statement analysis and spreadsheet-based evaluation of business performance and capital decisions.',
    skills: ['Corporate Finance', 'Financial Statement Analysis', 'Financial Analysis', 'Capital Decisions'],
    tools: ['Microsoft Excel'],
    keywords: ['CFI', 'Corporate Finance', 'Financial Statements', 'Excel'],
    credentialUrl: '',
  },
  {
    id: 'microsoft-project-management',
    name: 'Career Essentials in Project Management',
    issuer: 'Microsoft · LinkedIn Learning',
    year: 2024,
    category: 'Professional Skills',
    gained: 'Built a structured approach to project planning, prioritization, stakeholder coordination, execution tracking and delivery management.',
    skills: ['Project Management', 'Planning', 'Stakeholder Coordination', 'Execution'],
    tools: [],
    keywords: ['Microsoft', 'Project Management', 'Planning', 'Execution'],
    credentialUrl: '',
  },
  {
    id: 'coursera-stock-valuation',
    name: 'Stock Valuation with Comparable Companies Analysis',
    issuer: 'Coursera Project Network',
    year: 2024,
    category: 'Investment Research',
    gained: 'Applied trading-comparable methodology to value a company using peer selection, operating metrics and valuation multiples.',
    skills: ['Comparable Companies Analysis', 'Equity Valuation', 'Peer Benchmarking', 'Multiples'],
    tools: ['Excel'],
    keywords: ['Comps', 'Trading Multiples', 'Stock Valuation', 'Equity Research'],
    credentialUrl: 'https://coursera.org/verify/J6BAVUSXUXBQ',
  },
]

const FILTERS = ['All', 'Finance & Modeling', 'Investment Banking', 'Investment Research', 'Banking & Credit', 'Data & BI', 'AI & Technology', 'Professional Skills']

function CertificateCard({ cert }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-[0_16px_36px_-28px_rgba(37,99,235,.55)] transition-all flex flex-col min-h-[330px]">
      <div className="flex items-start justify-between gap-3">
        <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center"><BadgeCheck className="h-5 w-5 text-blue-600" /></div>
        <div className="text-right"><div className="text-[9px] uppercase tracking-[.16em] text-slate-400">{cert.year}</div><div className="mt-1 text-[9px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500">{cert.category}</div></div>
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-[.12em] text-blue-600">{cert.issuer}</div>
      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-slate-950">{cert.name}</h3>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-600">{cert.gained}</p>

      <div className="mt-4">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Skills gained</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{cert.skills.map((x) => <span key={x} className="text-[9.5px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">{x}</span>)}</div>
      </div>

      {cert.tools.length > 0 && <div className="mt-3"><div className="text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Wrench className="h-3 w-3" /> Tools</div><div className="mt-2 flex flex-wrap gap-1.5">{cert.tools.map((x) => <span key={x} className="text-[9.5px] px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200">{x}</span>)}</div></div>}

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-x-2 gap-y-1">{cert.keywords.slice(0, 5).map((x) => <span key={x} className="text-[8.5px] uppercase tracking-wider text-slate-400">#{x.replace(/\s+/g, '')}</span>)}</div>
        {cert.credentialUrl && <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-blue-600 hover:text-blue-800">Verify credential <ExternalLink className="h-3 w-3" /></a>}
      </div>
    </article>
  )
}

export default function CertificateGallery() {
  const [target, setTarget] = useState(null)
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const attach = () => {
      const old = document.querySelector('.recruiter-body #certifications')
      if (!old) return false
      old.style.display = 'none'
      let mount = document.getElementById('complete-certificates-gallery-mount')
      if (!mount) {
        mount = document.createElement('div')
        mount.id = 'complete-certificates-gallery-mount'
        old.parentNode?.insertBefore(mount, old)
      }
      setTarget(mount)
      return true
    }
    if (attach()) return
    const timer = setInterval(() => { if (attach()) clearInterval(timer) }, 200)
    return () => clearInterval(timer)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CERTIFICATES.filter((c) => (filter === 'All' || c.category === filter) && (!q || [c.name, c.issuer, c.category, ...c.skills, ...c.tools, ...c.keywords].join(' ').toLowerCase().includes(q)))
  }, [filter, query])

  if (!target) return null

  return createPortal(
    <section id="certifications" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11 scroll-mt-20">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
        <div>
          <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><Award className="h-4 w-4 text-blue-600" /></span><h2 className="text-[15px] font-semibold uppercase tracking-[.12em] text-slate-700">Certifications & Applied Learning</h2></div>
          <p className="mt-2 text-[11.5px] text-slate-500 max-w-2xl">15 completed credentials spanning finance, valuation, investment banking, analytics, AI, Excel, Oracle reporting and project execution. Each card highlights the capability I took away—not just the certificate title.</p>
        </div>
        <div className="relative w-full lg:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skills, tools, issuer…" className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[11px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">{FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-3 py-1.5 rounded-full text-[9.5px] border transition ${filter === f ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-700'}`}>{f}</button>)}</div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{visible.map((cert) => <CertificateCard key={cert.id} cert={cert} />)}</div>
      <div className="mt-4 text-[9.5px] text-slate-400">Showing {visible.length} of {CERTIFICATES.length} credentials · Filters are recruiter-friendly and searchable by skill or tool.</div>
    </section>,
    target,
  )
}
