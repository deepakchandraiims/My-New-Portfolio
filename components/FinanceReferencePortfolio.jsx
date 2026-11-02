'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, ChevronRight,
  Clock3, Download, ExternalLink, FileText, Landmark, Linkedin, Mail,
  MapPin, Moon, Sparkles, Sun, X,
} from 'lucide-react'
import { SEED_CONTENT } from '@/lib/portfolio-data'
import { RECRUITER_PROJECTS } from '@/lib/recruiter-projects'
import s from './FinanceReferencePortfolio.module.css'

const FALLBACK_OWNER = {
  name: 'Deepak Chandra',
  role: 'Strategic Finance · M&A · Private Markets',
  currentRole: 'Strategic Finance · M&A',
  location: 'Delhi NCR, India',
  tagline: 'I build investment-grade analysis, transaction models and decision frameworks for capital allocation.',
  email: '',
  linkedin: '',
  resumeUrl: '',
  portraitUrl: '',
  portraitFocal: { x: 50, y: 30 },
}

const ROLES = ['M&A', 'Strategic Finance', 'Private Equity', 'Special Situations', 'Private Credit', 'Investment Research']

const LANES = [
  { key: 'private-equity', label: 'Private Equity', eyebrow: 'Buyouts · LBO · IC', tint: '#6e6258', match: /private equity|lbo|buyout/i },
  { key: 'investment-banking', label: 'Investment Banking', eyebrow: 'M&A · Advisory · Valuation', tint: '#7c5b52', match: /investment banking|m&a|merger|sell-side|carve|cross-border|strategic alternatives/i },
  { key: 'special-situations', label: 'Special Situations', eyebrow: 'Distressed · Rescue · Event', tint: '#7b6b49', match: /special situations|distressed|restruct|rescue|bankrupt|arbitrage/i },
  { key: 'private-credit', label: 'Private Credit', eyebrow: 'Underwriting · Covenants · Recovery', tint: '#59645d', match: /private credit|direct lending|unitranche|covenant|recovery|sponsor financing/i },
  { key: 'growth-equity', label: 'Growth Equity', eyebrow: 'Minority · SaaS · Pre-IPO', tint: '#4f6070', match: /growth equity|growth|saas|pre-ipo|minority/i },
  { key: 'hedge-fund', label: 'Public Markets', eyebrow: 'Long / Short · Event · Variant', tint: '#675b70', match: /hedge fund|long \/ short|activist|short-seller|pair trade|merger arbitrage|variant/i },
]

const QUOTES = [
  ['Price is what you pay. Value is what you get.', 'Warren Buffett'],
  ['The intelligent investor is a realist who sells to optimists and buys from pessimists.', 'Benjamin Graham'],
  ['The big money is not in the buying and selling, but in the waiting.', 'Charlie Munger'],
  ['You can’t predict. You can prepare.', 'Howard Marks'],
  ['Know what you own, and know why you own it.', 'Peter Lynch'],
  ['Don’t look for the needle in the haystack. Just buy the haystack.', 'John C. Bogle'],
  ['He who lives by the crystal ball will eat shattered glass.', 'Ray Dalio'],
  ['It’s not whether you’re right or wrong, but how much money you make when you’re right.', 'George Soros'],
  ['Diversification is the only free lunch in finance.', 'Harry Markowitz'],
]

function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)) }

function projectLane(project) {
  const hay = [project.category, project.title, project.subtitle, project.industry, ...(project.tags || [])].filter(Boolean).join(' ')
  return LANES.find((lane) => lane.match.test(hay))?.key || 'investment-banking'
}

function yearOf(entry, fallback = new Date().getFullYear()) {
  const nums = String(entry?.period || entry?.date || '').match(/20\d{2}/g)
  return Number(nums?.[nums.length - 1] || nums?.[0] || fallback)
}

function initials(name = '') {
  return String(name).split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || 'DC'
}

function WorkDoor({ lane, index, count, active, onClick }) {
  return (
    <button className={`${s.doorUnit} ${active ? s.doorActive : ''}`} style={{ '--door-tint': lane.tint }} onClick={onClick}>
      <div className={s.doorGlow} />
      <div className={s.doorFrame}>
        <div className={s.doorFace}>
          <span className={s.doorIndex}>{String(index + 1).padStart(2, '0')}</span>
          <span className={s.doorMark}>{initials(lane.label)}</span>
          <span className={s.doorHandle} />
          <span className={s.doorCount}>{count} cases</span>
        </div>
      </div>
      <div className={s.doorCopy}>
        <div className={s.doorEyebrow}>{lane.eyebrow}</div>
        <h3>{lane.label}</h3>
        <p>Open the mandate room <ArrowUpRight size={13} /></p>
      </div>
    </button>
  )
}

function ProjectPanel({ project, files, onClose }) {
  if (!project) return null
  const projectFiles = files.filter((f) => f.projectId === project.id && !String(f.label || '').startsWith('__project_thumbnail__'))
  const cover = project.coverImageUrl || files.find((f) => f.projectId === project.id && String(f.label || '').startsWith('__project_thumbnail__'))?.publicUrl || ''
  return (
    <div className={s.modalBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <article className={s.projectPanel}>
        <button className={s.modalClose} onClick={onClose} aria-label="Close project"><X size={17} /></button>
        {cover ? <div className={s.projectHeroImage} style={{ backgroundImage: `url("${cover}")` }} /> : <div className={s.projectHeroImagePlaceholder}><Landmark size={34} /></div>}
        <div className={s.projectPanelBody}>
          <div className={s.projectKicker}>{project.category || 'Finance case'} · {project.year || 'Case study'}</div>
          <h2>{project.title}</h2>
          <p className={s.projectLead}>{project.executiveSummary || project.summary || project.impact || project.subtitle}</p>
          {(project.metrics || []).length > 0 && (
            <div className={s.metricGrid}>
              {(project.metrics || []).slice(0, 4).map((m, i) => <div key={i}><span>{m.k || m.label}</span><strong>{m.v || m.value}</strong></div>)}
            </div>
          )}
          {project.problem && <section><span className={s.smallLabel}>Situation</span><p>{project.problem}</p></section>}
          {(project.approach || []).length > 0 && <section><span className={s.smallLabel}>Approach</span><ol>{project.approach.map((x, i) => <li key={i}>{x}</li>)}</ol></section>}
          {project.impact && <section><span className={s.smallLabel}>Outcome</span><p>{project.impact}</p></section>}
          {projectFiles.length > 0 && (
            <section>
              <span className={s.smallLabel}>Project files</span>
              <div className={s.fileList}>
                {projectFiles.map((f) => <a key={f.id} href={f.publicUrl} target="_blank" rel="noreferrer"><FileText size={15} /><span>{f.label || f.originalName}</span><ExternalLink size={13} /></a>)}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}

export default function FinanceReferencePortfolio() {
  const [content, setContent] = useState(SEED_CONTENT)
  const [files, setFiles] = useState([])
  const [dark, setDark] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [headerAway, setHeaderAway] = useState(false)
  const [headerStuck, setHeaderStuck] = useState(false)
  const [activeLane, setActiveLane] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [activeStory, setActiveStory] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const workRef = useRef(null)
  const trackRef = useRef(null)
  const storyRefs = useRef([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/content', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/files', { cache: 'no-store' }).then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([nextContent, nextFiles]) => {
      if (cancelled) return
      if (nextContent && !nextContent.error) setContent((prev) => ({ ...prev, ...nextContent }))
      setFiles(Array.isArray(nextFiles) ? nextFiles : [])
    })
    const t = setTimeout(() => setLoaded(true), 650)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setRoleIndex((i) => (i + 1) % ROLES.length), 2600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }))
      setDate(d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }))
    }
    tick(); const id = setInterval(tick, 30000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHeaderStuck(y > 36)
      setHeaderAway(y > 180 && y > last + 8)
      if (y < last - 8) setHeaderAway(false)
      last = y

      const sec = workRef.current
      const track = trackRef.current
      if (sec && track && window.innerWidth >= 900) {
        const rect = sec.getBoundingClientRect()
        const maxY = Math.max(1, sec.offsetHeight - window.innerHeight)
        const progress = clamp(-rect.top / maxY)
        const travel = Math.max(0, track.scrollWidth - window.innerWidth + 110)
        track.style.transform = `translate3d(${-travel * progress}px,0,0)`
      }
    }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])

  const owner = useMemo(() => ({ ...FALLBACK_OWNER, ...(content?.owner || {}) }), [content])
  const visibleProjects = useMemo(() => {
    const base = Array.isArray(content?.projects) && content.projects.length ? content.projects : RECRUITER_PROJECTS
    return base.filter((p) => p && p.hidden !== true)
  }, [content])

  const laneProjects = useMemo(() => {
    const map = Object.fromEntries(LANES.map((x) => [x.key, []]))
    visibleProjects.forEach((p) => (map[projectLane(p)] || map['investment-banking']).push(p))
    return map
  }, [visibleProjects])

  const story = useMemo(() => {
    const exp = (content?.experience || []).map((x) => ({ ...x, kind: 'Experience', title: x.role, org: x.company, details: x.bullets || [], year: yearOf(x) }))
    const edu = (content?.education || []).map((x) => ({ ...x, kind: 'Education', title: x.degree, org: x.institution, details: x.details ? [x.details] : [], year: yearOf(x) }))
    const combined = [...exp, ...edu]
    if (combined.length) return combined
    return [
      { kind: 'Experience', title: 'Strategic Finance & M&A', org: 'Current role', period: '2026 — Now', year: 2026, details: ['Corporate development, financial analysis and transaction work.'] },
      { kind: 'Education', title: 'MBA · Strategy & Finance', org: 'IIM Sambalpur', period: '2023 — 2025', year: 2025, details: ['Finance, strategy and transaction-oriented coursework.'] },
    ]
  }, [content])

  useEffect(() => {
    const nodes = storyRefs.current.filter(Boolean)
    if (!nodes.length) return
    const io = new IntersectionObserver((entries) => {
      const best = entries.filter((e) => e.isIntersecting).sort((a, b) => Math.abs(a.boundingClientRect.top - innerHeight * .46) - Math.abs(b.boundingClientRect.top - innerHeight * .46))[0]
      if (best) setActiveStory(Number(best.target.dataset.storyIndex || 0))
    }, { rootMargin: '-34% 0px -38% 0px', threshold: [0, .2, .6, 1] })
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [story.length])

  const tools = Array.isArray(content?.toolCatalog) ? content.toolCatalog : []
  const certs = Array.isArray(content?.certifications) ? content.certifications : []
  const activeStoryItem = story[activeStory] || story[0]
  const focal = owner.portraitFocal || { x: 50, y: 30 }

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className={s.root} data-theme={dark ? 'dark' : 'light'}>
      <div className={`${s.loader} ${loaded ? s.loaderDone : ''}`} aria-hidden="true">
        <div className={s.loaderStack}>
          {['Deepak Chandra', 'Strategic Finance', 'M&A', 'Private Markets', 'Investment Research'].map((x, i) => <div key={x} style={{ '--i': i }}>{x}</div>)}
        </div>
        <div className={s.loaderLine}><span /></div>
      </div>

      <header className={`${s.header} ${headerStuck ? s.headerStuck : ''} ${headerAway ? s.headerAway : ''}`}>
        <div className={s.shell}>
          <div className={s.headerInner}>
            <button className={s.brand} onClick={() => scrollTo('top')}>{owner.name}</button>
            <nav>
              <button onClick={() => scrollTo('work')}>Work</button>
              <button onClick={() => scrollTo('story')}>Story</button>
              <button onClick={() => scrollTo('toolkit')}>Toolkit</button>
              <button onClick={() => scrollTo('contact')}>Contact</button>
            </nav>
            <div className={s.headerRight}>
              <div className={s.clockChip}><span>IND</span><strong>{time}</strong><i>·</i><span>{date}</span></div>
              <button className={s.themeButton} onClick={() => setDark((x) => !x)} aria-label="Toggle theme">{dark ? <Sun size={15} /> : <Moon size={15} />}</button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="top" className={s.hero}>
          <div className={s.heroVignette} />
          <div className={s.shell}>
            <div className={s.heroGrid}>
              <div className={s.heroCopy}>
                <div className={s.eyebrow}><BriefcaseBusiness size={14} /> Finance · Transactions · Investing</div>
                <h1>
                  <span>Hi, I’m {owner.name?.split(' ')[0] || 'Deepak'}.</span>
                  <span>I work across <em key={ROLES[roleIndex]}>{ROLES[roleIndex]}</em>.</span>
                </h1>
                <p>{owner.tagline || owner.bio}</p>
                <div className={s.heroButtons}>
                  <button className={s.primaryButton} onClick={() => scrollTo('work')}>See my work <ArrowRight size={16} /></button>
                  {owner.resumeUrl ? <a className={s.secondaryButton} href={owner.resumeUrl} target="_blank" rel="noreferrer">Resume <Download size={15} /></a> : <button className={s.secondaryButton} onClick={() => scrollTo('story')}>Experience <ArrowDown size={15} /></button>}
                </div>
              </div>

              <div className={s.portraitStage}>
                <div className={s.portraitWord}>CAPITAL</div>
                <div className={s.portraitFrame}>
                  {owner.portraitUrl ? (
                    <img src={owner.portraitUrl} alt={owner.name || 'Portrait'} style={{ objectPosition: `${focal.x ?? 50}% ${focal.y ?? 30}%` }} />
                  ) : (
                    <div className={s.portraitPlaceholder}>
                      <span>{initials(owner.name)}</span>
                      <small>Portrait space</small>
                    </div>
                  )}
                  <div className={s.portraitBadge}><Sparkles size={13} /> {owner.currentRole || 'Strategic Finance'}</div>
                </div>
              </div>
            </div>
          </div>
          <div className={s.heroBar}>
            <div><span className={s.liveDot} /> Building investment-grade work</div>
            <div className={s.heroBarMid}>{owner.location || 'India'}</div>
            <button onClick={() => scrollTo('work')}>Scroll to explore <ArrowDown size={14} /></button>
          </div>
        </section>

        <section className={s.quoteBand} aria-label="Investment philosophy">
          <div className={s.quoteTrack}>
            {[...QUOTES, ...QUOTES].map(([q, a], i) => <div key={i}><span>“{q}”</span><strong>{a}</strong></div>)}
          </div>
        </section>

        <section id="work" ref={workRef} className={s.work}>
          <div className={s.workSticky}>
            <div className={s.shell}>
              <div className={s.workIntro}>
                <div className={s.eyebrow}>Selected finance work</div>
                <h2>The work lives behind the doors.</h2>
                <p>Scroll through the wall. Open a mandate to see the underlying cases, models and attached files.</p>
              </div>
            </div>
            <div className={s.wallWindow}>
              <div ref={trackRef} className={s.doorTrack}>
                {LANES.map((lane, i) => <WorkDoor key={lane.key} lane={lane} index={i} count={laneProjects[lane.key]?.length || 0} active={activeLane === lane.key} onClick={() => setActiveLane(lane.key)} />)}
              </div>
              <div className={s.floor} />
            </div>
            <div className={s.workHint}>Scroll sideways through vertical movement · Click a door to enter</div>
          </div>
        </section>

        <section id="story" className={s.story}>
          <div className={s.storyAmbient} />
          <div className={s.shell}>
            <div className={s.storyGrid}>
              <aside className={s.storyClock}>
                <div className={s.eyebrow}>My story</div>
                <h2>Let’s go back through the work.</h2>
                <div className={s.bigYear}>{activeStoryItem?.year || '—'}</div>
                <div className={s.storyWhen}>{activeStoryItem?.period || activeStoryItem?.kind}</div>
                <div className={s.storyMeter}><span>{String(activeStory + 1).padStart(2, '0')}</span><i /><span>{String(story.length).padStart(2, '0')}</span></div>
              </aside>
              <div className={s.timeline}>
                <div className={s.timelineRail} />
                {story.map((item, i) => (
                  <article key={item.id || `${item.title}-${i}`} ref={(el) => { storyRefs.current[i] = el }} data-story-index={i} className={`${s.storyItem} ${activeStory === i ? s.storyItemActive : ''}`}>
                    <span className={s.storyDot} />
                    <div className={s.storyDate}>{item.period || item.kind}</div>
                    <h3>{item.title}</h3>
                    <div className={s.storyOrg}>{item.org}{item.location ? ` · ${item.location}` : ''}</div>
                    <ul>{(item.details || []).slice(0, 4).map((x, j) => <li key={j}>{x}</li>)}</ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="toolkit" className={s.toolkit}>
          <div className={s.shell}>
            <div className={s.toolkitHeader}>
              <div>
                <div className={s.eyebrow}>Operating toolkit</div>
                <h2>Tools are leverage. Judgement is the product.</h2>
              </div>
              <p>Model, research, diligence, synthesize and communicate—with the stack kept visible rather than hidden behind buzzwords.</p>
            </div>
            {tools.length ? (
              <div className={s.toolsGrid}>
                {tools.map((tool, i) => <div key={tool.name || i} className={s.toolCard}>{tool.logoUrl ? <img src={tool.logoUrl} alt="" /> : <span>{initials(tool.name)}</span>}<div><strong>{tool.name}</strong><small>{tool.category}</small></div></div>)}
              </div>
            ) : (
              <div className={s.skillFallback}>
                {['Financial Modeling', 'Valuation', 'M&A', 'LBO', 'Private Credit', 'Market Research', 'Excel', 'PowerPoint', 'Capital IQ', 'PitchBook', 'AI Research'].map((x) => <span key={x}>{x}</span>)}
              </div>
            )}

            {certs.length > 0 && (
              <div className={s.certRail}>
                <div className={s.certTitle}>Selected credentials</div>
                <div className={s.certTrack}>
                  {certs.slice(0, 12).map((c, i) => <div key={c.id || i}><span>{String(i + 1).padStart(2, '0')}</span><strong>{c.name || c.title}</strong><small>{c.issuer}{c.year ? ` · ${c.year}` : ''}</small></div>)}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="contact" className={s.contact}>
          <div className={s.shell}>
            <div className={s.contactTop}>
              <div className={s.eyebrow}>Open a conversation</div>
              <h2>Have a deal, model or investment question worth discussing?</h2>
              <p>I’m most interested in M&A, strategic finance, private markets and investment work where the answer has to survive scrutiny.</p>
            </div>
            <div className={s.contactActions}>
              {owner.email && <a href={`mailto:${owner.email}`}><Mail size={17} /> Email me <ArrowUpRight size={15} /></a>}
              {owner.linkedin && <a href={owner.linkedin} target="_blank" rel="noreferrer"><Linkedin size={17} /> LinkedIn <ArrowUpRight size={15} /></a>}
              {owner.resumeUrl && <a href={owner.resumeUrl} target="_blank" rel="noreferrer"><Download size={17} /> Resume <ArrowUpRight size={15} /></a>}
            </div>
            <div className={s.footer}>
              <span>© {new Date().getFullYear()} {owner.name}</span>
              <span><MapPin size={12} /> {owner.location || 'India'}</span>
              <a href="/admin">Admin</a>
            </div>
          </div>
        </section>
      </main>

      {activeLane && (
        <div className={s.laneBackdrop} onMouseDown={(e) => e.target === e.currentTarget && setActiveLane(null)}>
          <section className={s.lanePanel}>
            <div className={s.laneHead}>
              <div><div className={s.smallLabel}>Mandate room</div><h2>{LANES.find((x) => x.key === activeLane)?.label}</h2></div>
              <button onClick={() => setActiveLane(null)}><X size={17} /></button>
            </div>
            <div className={s.laneGrid}>
              {(laneProjects[activeLane] || []).map((p, i) => {
                const attached = files.filter((f) => f.projectId === p.id && !String(f.label || '').startsWith('__project_thumbnail__'))
                const cover = p.coverImageUrl || files.find((f) => f.projectId === p.id && String(f.label || '').startsWith('__project_thumbnail__'))?.publicUrl
                return <button key={p.id || i} className={s.caseCard} onClick={() => setActiveProject(p)}>
                  <div className={s.caseVisual}>{cover ? <img src={cover} alt="" /> : <span>{String(i + 1).padStart(2, '0')}</span>}</div>
                  <div className={s.caseBody}><small>{p.category || 'Finance'} · {p.year || 'Case'}</small><h3>{p.title}</h3><p>{p.impact || p.subtitle || p.executiveSummary}</p><div>{attached.length ? `${attached.length} attached file${attached.length === 1 ? '' : 's'}` : 'Open case'} <ChevronRight size={13} /></div></div>
                </button>
              })}
              {!(laneProjects[activeLane] || []).length && <div className={s.emptyLane}>No published projects are currently assigned to this mandate room.</div>}
            </div>
          </section>
        </div>
      )}

      <ProjectPanel project={activeProject} files={files} onClose={() => setActiveProject(null)} />
    </div>
  )
}
