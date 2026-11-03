'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Award, ExternalLink, Layers3, Search, Sparkles, Wrench,
} from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CERTIFICATE_META, DEMO_INVESTMENT_LAB, inr } from '@/lib/portfolio-showcase-data'
import s from './PortfolioShowcaseSections.module.css'

function SectionTitle({eyebrow,title,copy,right}) {
  return <div className={s.sectionTitle}><div><p>{eyebrow}</p><h2>{title}</h2><div className={s.rule}/><span>{copy}</span></div>{right}</div>
}

function InvestmentPreview() {
  const [lab,setLab]=useState(DEMO_INVESTMENT_LAB)
  const [mode,setMode]=useState('manual')

  useEffect(()=>{
    let active=true
    fetch('/api/portfolio/live',{cache:'no-store'}).then(async r=>{
      if(!r.ok) throw new Error()
      return r.json()
    }).then(d=>{
      if(!active||!Array.isArray(d?.holdings)||!d.holdings.length)return
      const totals=d.totals||{}
      setLab(prev=>({...prev,metrics:{...prev.metrics,
        portfolioValue:Number.isFinite(Number(totals.currentValue))?Number(totals.currentValue):prev.metrics.portfolioValue,
        investedCapital:Number.isFinite(Number(totals.investedCapital??totals.costValue))?Number(totals.investedCapital??totals.costValue):prev.metrics.investedCapital,
        absoluteReturn:Number.isFinite(Number(totals.absoluteReturnPct??totals.returnPct))?Number(totals.absoluteReturnPct??totals.returnPct):prev.metrics.absoluteReturn,
        dayPnL:Number.isFinite(Number(totals.dayPnL))?Number(totals.dayPnL):prev.metrics.dayPnL,
        dayPct:Number.isFinite(Number(totals.dayPct))?Number(totals.dayPct):prev.metrics.dayPct,
      }}))
      setMode('live')
    }).catch(()=>{})

    return()=>{active=false}
  },[])

  const m=lab.metrics
  return <section id="investment-lab" className={`${s.section} ${s.labSection}`}>
    <div className={s.shell}>
      <SectionTitle eyebrow="Investment Lab" title="A living record of how I invest." copy="Portfolio construction, investment research, decision journals and risk analytics — preserved as a process, not just a return number." right={<div className={s.modeBadge}><i className={mode==='live'?s.liveDot:s.manualDot}/>{mode==='live'?'Live market connection':'Educational / manual mode'}</div>}/>
      <div className={s.labGrid}>
        <div className={s.labLeft}>
          <div className={s.metricRow}>
            <div><span>Portfolio value</span><strong>{inr(m.portfolioValue,true)}</strong></div>
            <div><span>Absolute return</span><strong className={s.positive}>+{Number(m.absoluteReturn).toFixed(1)}%</strong></div>
            <div><span>CAGR / XIRR</span><strong className={s.positive}>+{Number(m.cagr).toFixed(1)}%</strong></div>
            <div><span>vs NIFTY 50</span><strong className={s.positive}>+{Number(m.alphaVsBenchmark).toFixed(1)} pp</strong></div>
          </div>
          <div className={s.previewChart}>
            <div className={s.previewChartHead}><div><span>Portfolio vs Benchmark</span><b>Since inception</b></div><small>Process &gt; prediction</small></div>
            <div className={s.previewChartCanvas}><ResponsiveContainer width="100%" height="100%"><LineChart data={lab.performance}><CartesianGrid vertical={false} stroke="rgba(26,24,24,.07)"/><XAxis dataKey="date" hide/><YAxis hide domain={['auto','auto']}/><Tooltip contentStyle={{fontSize:10,borderRadius:10,border:'1px solid rgba(26,24,24,.12)'}}/><Line type="monotone" dataKey="portfolio" stroke="#244d86" strokeWidth={2.4} dot={false}/><Line type="monotone" dataKey="benchmark" stroke="#b3a697" strokeWidth={1.8} dot={false}/></LineChart></ResponsiveContainer></div>
          </div>
        </div>
        <aside className={s.labRight}>
          <div className={s.labNote}><span>01</span><div><b>Portfolio</b><p>Holdings, allocation and position-level thesis tracking.</p></div></div>
          <div className={s.labNote}><span>02</span><div><b>Research</b><p>Company, sector and thematic notes before outcomes are known.</p></div></div>
          <div className={s.labNote}><span>03</span><div><b>Journal</b><p>Adds, trims, passes and post-investment reviews.</p></div></div>
          <div className={s.labNote}><span>04</span><div><b>Analytics</b><p>Risk, drawdown, beta, alpha and attribution.</p></div></div>
          <Link href="/investment-lab" className={s.enterLab}>Enter Investment Lab <ArrowRight size={15}/></Link>
        </aside>
      </div>
    </div>
  </section>
}

function Skills({content}) {
  const groups=Array.isArray(content?.skills)&&content.skills.length?content.skills:[
    {group:'Finance & Valuation',items:['Financial Modeling','DCF','LBO','Trading Comparables','Precedent Transactions','Sensitivity & Scenario Analysis']},
    {group:'Transactions & Strategy',items:['M&A Process','Target Screening','Due Diligence','Strategic Alternatives','Investment Memo','Board Communication']},
    {group:'Analysis & Research',items:['Market Sizing','Competitive Intelligence','Equity Research','Private Markets Research','Industry Mapping']},
    {group:'Data & Automation',items:['Excel','SQL','Power BI','AI Research Workflows','Structured Analysis']},
  ]
  const [active,setActive]=useState(0)
  const group=groups[active]||groups[0]
  return <section id="skills" className={s.section}><div className={s.shell}>
    <SectionTitle eyebrow="My Skills" title="Finance judgement, built through applied work." copy="The emphasis is on capabilities I use to frame, model, research and communicate finance decisions — not a list of software badges."/>
    <div className={s.skillsGrid}>
      <div className={s.skillNav}>{groups.map((g,i)=><button key={g.group} className={active===i?s.skillNavOn:''} onClick={()=>setActive(i)}><span>{String(i+1).padStart(2,'0')}</span><b>{g.group}</b><ArrowRight size={14}/></button>)}</div>
      <div className={s.skillPanel}><div className={s.skillPanelHead}><span>Active capability set</span><h3>{group?.group}</h3></div><div className={s.skillItems}>{(group?.items||[]).map((x,i)=><div key={x}><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b><small>{i<3?'Core / frequently applied':'Applied / working capability'}</small></div>)}</div></div>
    </div>
  </div></section>
}

function Tools({content}) {
  const catalog=Array.isArray(content?.toolCatalog)&&content.toolCatalog.length?content.toolCatalog:
    (content?.tools||[]).map(name=>({name,category:'Tools & Platforms',logoUrl:''}))
  const cats=['All',...new Set(catalog.map(t=>t.category).filter(Boolean))]
  const [filter,setFilter]=useState('All')
  const [query,setQuery]=useState('')
  const visible=catalog.filter(t=>(filter==='All'||t.category===filter)&&(!query||t.name.toLowerCase().includes(query.toLowerCase())))
  return <section id="tools" className={`${s.section} ${s.toolsSection}`}><div className={s.shell}>
    <SectionTitle eyebrow="My Tools" title="The stack behind the analysis." copy="Model, research, diligence, visualize and communicate — with the platform stack visible rather than hidden behind buzzwords." right={<div className={s.toolSearch}><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tools…"/></div>}/>
    <div className={s.filters}>{cats.map(c=><button key={c} className={filter===c?s.filterOn:''} onClick={()=>setFilter(c)}>{c}</button>)}</div>
    <div className={s.toolsGrid}>{visible.map((t,i)=><article key={t.name}><div className={s.logoBox}>{t.logoUrl?<img src={t.logoUrl} alt=""/>:<span>{t.name.slice(0,2).toUpperCase()}</span>}</div><div><strong>{t.name}</strong><small>{t.category||'Platform'}</small></div><span className={s.toolIndex}>{String(i+1).padStart(2,'0')}</span></article>)}</div>
  </div></section>
}

function Certificates({content}) {
  const docs=content?.certificateDocuments||{}
  const [filter,setFilter]=useState('All')
  const [expanded,setExpanded]=useState(false)
  const cats=['All',...new Set(CERTIFICATE_META.map(c=>c.category))]
  const list=CERTIFICATE_META.filter(c=>filter==='All'||c.category===filter)
  const visible=expanded?list:list.slice(0,6)
  return <section id="certificates" className={s.section}><div className={s.shell}>
    <SectionTitle eyebrow="My Certificates" title="Applied learning, with the actual credentials attached." copy="Finance, investment banking, research, data, AI and execution programs — shown for the capability taken away, not just the certificate title." right={<Award size={34} strokeWidth={1.2}/>}/>
    <div className={s.filters}>{cats.map(c=><button key={c} className={filter===c?s.filterOn:''} onClick={()=>{setFilter(c);setExpanded(false)}}>{c}</button>)}</div>
    <div className={s.certGrid}>{visible.map((c,i)=>{
      const doc=docs[c.id]
      const image=doc?.url&&String(doc.mimeType||'').startsWith('image/')
      return <article key={c.id} className={s.certCard}>
        <div className={s.certVisual}>{image?<img src={doc.url} alt=""/>:<div className={s.certPaper}><div className={s.certSeal}><Award size={24}/></div><span>{c.issuer.split('·')[0].trim()}</span><strong>Certificate</strong><small>{c.year}</small></div>}</div>
        <div className={s.certBody}><div className={s.certMeta}><span>{c.category}</span><small>{c.year}</small></div><h3>{c.name}</h3><p>{c.gained}</p><div className={s.tags}>{c.skills.slice(0,3).map(x=><span key={x}>{x}</span>)}</div>{doc?.url?<a href={doc.url} target="_blank" rel="noreferrer">View certificate <ExternalLink size={12}/></a>:<span className={s.noFile}>Credential metadata · file can be attached in Admin</span>}</div>
      </article>
    })}</div>
    {list.length>6&&<button className={s.expandButton} onClick={()=>setExpanded(v=>!v)}>{expanded?'Show fewer certificates':'View all certificates'} <ArrowRight size={14}/></button>}
  </div></section>
}

export default function PortfolioShowcaseSections(){
  const [content,setContent]=useState({})
  useEffect(()=>{let active=true;fetch('/api/content',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(d=>active&&setContent(d||{})).catch(()=>{});return()=>{active=false}},[])
  return <><InvestmentPreview/><Skills content={content}/><Tools content={content}/><Certificates content={content}/></>
}
