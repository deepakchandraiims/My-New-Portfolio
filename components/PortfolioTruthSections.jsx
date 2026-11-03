'use client'

import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, Globe2, Layers3 } from 'lucide-react'
import s from './PortfolioTruthSections.module.css'

const QUOTES = [
  ['Price is what you pay. Value is what you get.', 'Warren Buffett'],
  ['You can’t predict. You can prepare.', 'Howard Marks'],
  ['The big money is not in the buying and selling, but in the waiting.', 'Charlie Munger'],
  ['Know what you own, and know why you own it.', 'Peter Lynch'],
]

const FLAGSHIPS = [
  {
    no: '01',
    eyebrow: 'Strategic M&A · Current-work style',
    title: 'DACH Expert Network Acquisition Strategy',
    question: 'Should an India-based expert network use acquisition to enter Europe?',
    copy: 'A strategic acquisition screen covering target quality, business-model fit, client mix, pricing, commercial synergies, market-entry logic and key diligence questions.',
    tags: ['M&A', 'Target Screening', 'Commercial Diligence', 'Cross-border'],
    tone: 'navy',
    icon: Building2,
    room: '/work/investment-banking',
  },
  {
    no: '02',
    eyebrow: 'Special Situations · Self-directed case',
    title: 'Structured Capital Investment Case',
    question: 'When does a capital need actually become a special-situations opportunity?',
    copy: 'A Bain-style underwriting framework focused on the funding gap, capital structure, downside recovery, contractual return, catalysts and the exact reason conventional capital cannot solve the situation.',
    tags: ['Structured Capital', 'Downside', 'Returns', 'IC'],
    tone: 'burgundy',
    icon: Layers3,
    room: '/work/special-situations',
  },
  {
    no: '03',
    eyebrow: 'Investment Research · Flagship report',
    title: 'India Passenger Vehicle Industry — 2018–2026',
    question: 'What actually changed underneath India’s headline auto growth?',
    copy: 'An industry research build using an 8,489-row dataset to trace segment mix, OEM share shifts, SUV penetration and the strategic events behind the numbers.',
    tags: ['Industry Research', 'Data', 'Market Share', 'India Auto'],
    tone: 'olive',
    icon: BarChart3,
    room: '/work/investment-research',
  },
]

export default function PortfolioTruthSections({ onNavigate }) {
  return (
    <>
      <section className={s.quoteBand} aria-label="Investment philosophy">
        <div className={s.quoteTrack}>
          {[...QUOTES, ...QUOTES].map(([q, a], i) => (
            <div key={i}><span>“{q}”</span><strong>{a}</strong></div>
          ))}
        </div>
      </section>

      <section className={s.proofStrip}>
        <div className={s.shell}>
          <div className={s.proofLead}>
            <span>Current positioning</span>
            <strong>Strategic Finance & M&A</strong>
          </div>
          <div><BriefcaseBusiness size={18}/><span>Current mandate</span><strong>Target sourcing, screening & evaluation</strong></div>
          <div><Layers3 size={18}/><span>Proof of work</span><strong>30+ finance cases & models</strong></div>
          <div><Globe2 size={18}/><span>Research scope</span><strong>India · Europe · US</strong></div>
          <div><BarChart3 size={18}/><span>Work library</span><strong>5 finance disciplines</strong></div>
        </div>
      </section>

      <section id="flagship-work" className={s.flagships}>
        <div className={s.shell}>
          <div className={s.flagshipHead}>
            <div>
              <p>Selected work / flagship decisions</p>
              <h2>Show the judgement first.</h2>
            </div>
            <span>These are analyses and case studies — not claims of completed transactions.</span>
          </div>

          <div className={s.cards}>
            {FLAGSHIPS.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.no} className={s.card} data-tone={item.tone}>
                  <div className={s.visual}>
                    <span className={s.no}>{item.no}</span>
                    <Icon size={58} strokeWidth={1.1}/>
                    <div className={s.visualLines}>{Array.from({length:5},(_,i)=><i key={i}/>)}</div>
                  </div>
                  <div className={s.body}>
                    <p className={s.eyebrow}>{item.eyebrow}</p>
                    <h3>{item.title}</h3>
                    <h4>{item.question}</h4>
                    <p className={s.copy}>{item.copy}</p>
                    <div className={s.tags}>{item.tags.map(t=><span key={t}>{t}</span>)}</div>
                    <button onClick={() => onNavigate?.(item.room)}>Explore this work <ArrowRight size={14}/></button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
