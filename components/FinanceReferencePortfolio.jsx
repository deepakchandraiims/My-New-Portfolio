'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Download, Mail, Menu, X } from 'lucide-react'
import { SEED_CONTENT } from '@/lib/portfolio-data'
import { FINANCE_ROOMS, cleanOwner, cleanStory, roomForProject, yearFromPeriod } from '@/lib/finance-site-map'
import s from './FinanceReferencePortfolio.module.css'

function RollingYear({ year }) {
  const digits = String(year || '2026').padStart(4, '0').slice(0, 4).split('')
  return (
    <div className={s.rollingYear} aria-label={String(year || '')}>
      {digits.map((digit, i) => (
        <span className={s.digitWindow} key={i}>
          <span className={s.digitColumn} style={{ transform: `translateY(-${Number(digit) * 1}em)`, transitionDelay: `${i * 45}ms` }}>
            {Array.from({ length: 10 }, (_, n) => <i key={n}>{n}</i>)}
          </span>
        </span>
      ))}
    </div>
  )
}

function ClockTunnel({ progress = 0, dark = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const W = rect.width
    const H = rect.height
    ctx.clearRect(0, 0, W, H)
    const cx = W * .48
    const cy = H * .53
    const ink = dark ? '238,234,230' : '26,24,24'
    const rings = 13
    for (let i = 0; i < rings; i++) {
      const phase = ((i / rings + progress * .68) % 1)
      const scale = .22 + phase * 1.9
      const r = Math.min(W, H) * .18 * scale
      const alpha = Math.max(0, .16 * (1 - phase))
      ctx.strokeStyle = `rgba(${ink},${alpha})`
      ctx.lineWidth = Math.max(.5, 1.25 * (1 - phase * .5))
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      const ticks = 36
      ctx.strokeStyle = `rgba(${ink},${alpha * 1.35})`
      for (let t = 0; t < ticks; t++) {
        const a = (t / ticks) * Math.PI * 2 - progress * Math.PI * 1.5 + i * .09
        const long = t % 3 === 0
        const len = (long ? 14 : 7) * (1 - phase * .35)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len))
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        ctx.stroke()
      }
    }
  }, [progress, dark])
  return <canvas ref={ref} className={s.tunnel} aria-hidden="true" />
}

function RoleCalendar({ index }) {
  const labels = FINANCE_ROOMS.map((r) => r.label)
  const label = labels[index % labels.length]
  return (
    <span className={s.calendarWrap}>
      <span className={s.calendarBody} key={label}>
        <span className={s.calendarRings}>{Array.from({ length: 11 }, (_, i) => <i key={i} />)}</span>
        <span className={s.calendarPage}>
          <span className={s.calendarHoles}>{Array.from({ length: 11 }, (_, i) => <i key={i} />)}</span>
          <strong>{label}</strong>
          <small>{String(index + 1).padStart(2, '0')} / {String(labels.length).padStart(2, '0')}</small>
        </span>
      </span>
    </span>
  )
}

function PullCord({ dark, setDark }) {
  const [drag, setDrag] = useState(0)
  const start = useRef(null)
  const down = (e) => {
    start.current = e.clientY
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e) => {
    if (start.current == null) return
    setDrag(Math.max(0, Math.min(86, e.clientY - start.current)))
  }
  const up = () => {
    if (drag > 42) setDark((x) => !x)
    start.current = null
    setDrag(0)
  }
  return (
    <div className={s.cord} style={{ '--pull': `${drag}px` }}>
      <span className={s.cordLine} />
      <button
        className={s.cordHandle}
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={() => setDark((x) => !x)}
      >
        <span />
      </button>
      <small>pull</small>
    </div>
  )
}

function AbilityCard({ owner, open, onClose }) {
  if (!open) return null
  return (
    <div className={s.cardLayer} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.abilityCard}>
        <button onClick={onClose} className={s.cardClose} aria-label="Close ability card"><X size={16} /></button>
        <div className={s.abilityTop}>
          <span>DC / FINANCE</span><span>{new Date().getFullYear()}</span>
        </div>
        <div className={s.abilityMonogram}>DC</div>
        <div className={s.abilityName}>{owner.name}</div>
        <div className={s.abilityRole}>{owner.currentRole || owner.role}</div>
        <div className={s.abilityRule} />
        <div className={s.abilityGrid}>
          <div><span>Core</span><b>M&A · Strategic Finance · Modelling</b></div>
          <div><span>Investing</span><b>Private Equity · Credit · Special Situations</b></div>
          <div><span>Location</span><b>{owner.location}</b></div>
          <div><span>Approach</span><b>Evidence first. Downside before upside.</b></div>
        </div>
      </div>
    </div>
  )
}

function FinanceDoor({ room, index, reveal, hovered, opening, onHover, onOpen, unitRef }) {
  const hidden = index === FINANCE_ROOMS.length - 1 && !reveal
  return (
    <li
      ref={unitRef}
      className={[
        s.unit,
        hidden ? s.secretUnit : '',
        hovered ? s.unitOn : '',
        opening ? s.unitOpening : '',
      ].filter(Boolean).join(' ')}
      style={{ '--door': room.color, '--door-dark': room.darkColor, '--i': index }}
    >
      <button
        className={s.doorway}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(index)}
        onBlur={() => onHover(null)}
        onClick={() => onOpen(room.slug)}
        aria-label={`Open the ${room.label} door`}
      >
        <span className={s.casing} />
        <span className={s.opening}>
          <span className={s.room} />
          <span className={s.spill} />
          <span className={s.door}>
            <span className={s.doorFlute} />
            <span className={s.plate}>{room.label}</span>
            <span className={s.handle}><span className={s.lever} /><span className={s.lock} /></span>
            <span className={s.doorShade} />
            <span className={s.leak} />
          </span>
          <span className={s.sill} />
        </span>
        <span className={s.pool} />
      </button>
    </li>
  )
}

function BackToTop({ progress }) {
  return (
    <button className={`${s.backTop} ${progress > .12 ? s.backTopShow : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="23" className={s.backTrack} />
        <circle cx="26" cy="26" r="23" className={s.backProgress} style={{ strokeDashoffset: 144.5 * (1 - progress) }} />
      </svg>
      <ArrowUp size={16} />
      <span>Back to top</span>
    </button>
  )
}

export default function FinanceReferencePortfolio() {
  const router = useRouter()
  const [content, setContent] = useState(SEED_CONTENT)
  const [loaded, setLoaded] = useState(false)
  const [dark, setDark] = useState(false)
  const [role, setRole] = useState(0)
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [menu, setMenu] = useState(false)
  const [ability, setAbility] = useState(false)
  const [hoveredDoor, setHoveredDoor] = useState(null)
  const [openingDoor, setOpeningDoor] = useState(null)
  const [doorReveal, setDoorReveal] = useState(false)
  const [storyIndex, setStoryIndex] = useState(0)
  const [storyProgress, setStoryProgress] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [doorInfoStyle, setDoorInfoStyle] = useState({})
  const doorsRef = useRef(null)
  const doorsWallRef = useRef(null)
  const doorUnits = useRef([])
  const storyRef = useRef(null)
  const storyItems = useRef([])

  useEffect(() => {
    let alive = true
    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (alive && d && !d.error) setContent((prev) => ({ ...prev, ...d })) })
      .catch(() => {})
      .finally(() => setTimeout(() => alive && setLoaded(true), 420))
    const fallback = setTimeout(() => setLoaded(true), 1200)
    return () => { alive = false; clearTimeout(fallback) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setRole((i) => (i + 1) % FINANCE_ROOMS.length), 2700)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toLowerCase())
      setDate(d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    tick(); const id = setInterval(tick, 20000); return () => clearInterval(id)
  }, [])

  const owner = useMemo(() => cleanOwner(content.owner || {}), [content.owner])
  const story = useMemo(() => cleanStory(content), [content])
  const projects = useMemo(() => {
    const arr = Array.isArray(content.projects) ? content.projects : []
    return arr.filter((p) => p && p.hidden !== true)
  }, [content.projects])
  const roomCounts = useMemo(() => {
    const counts = Object.fromEntries(FINANCE_ROOMS.map((r) => [r.slug, 0]))
    projects.forEach((p) => { counts[roomForProject(p).slug] += 1 })
    return counts
  }, [projects])

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setScrollProgress(Math.min(1, window.scrollY / max))

      const d = doorsRef.current
      if (d) {
        const r = d.getBoundingClientRect()
        const denom = Math.max(1, d.offsetHeight - window.innerHeight)
        const p = Math.max(0, Math.min(1, -r.top / denom))
        setDoorReveal(p > .22 || window.innerWidth < 900)
      }

      const st = storyRef.current
      if (st) {
        const r = st.getBoundingClientRect()
        const denom = Math.max(1, st.offsetHeight - window.innerHeight)
        setStoryProgress(Math.max(0, Math.min(1, -r.top / denom)))
      }
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  useEffect(() => {
    if (hoveredDoor == null || window.innerWidth < 900) {
      setDoorInfoStyle({})
      return
    }

    let raf = 0
    const place = () => {
      const wall = doorsWallRef.current
      const active = doorUnits.current[hoveredDoor]
      if (!wall || !active) return

      const visible = doorUnits.current.filter((node) => {
        if (!node) return false
        const cs = getComputedStyle(node)
        return cs.visibility !== 'hidden' && cs.display !== 'none' && Number.parseFloat(cs.opacity || '1') > 0
      })
      const vi = visible.indexOf(active)
      if (vi < 0) return

      const wr = wall.getBoundingClientRect()
      const ar = active.getBoundingClientRect()
      const toRight = vi < 2 && visible[vi + 2]
      const a = toRight ? visible[vi + 1]?.getBoundingClientRect() : (visible[vi - 2] || visible[vi - 1])?.getBoundingClientRect()
      const b = toRight ? visible[vi + 2]?.getBoundingClientRect() : visible[vi - 1]?.getBoundingClientRect()
      if (!a || !b) return

      const left = Math.min(a.left, b.left)
      const right = Math.max(a.right, b.right)
      const width = Math.min(right - left, 352)
      const info = wall.querySelector('[data-door-info]')
      const infoHeight = info?.offsetHeight || 220

      setDoorInfoStyle({
        width: `${Math.max(260, width)}px`,
        left: `${left - wr.left + (right - left - Math.max(260, width)) / 2}px`,
        top: `${ar.top - wr.top + ar.height * 0.5 - infoHeight * 0.5}px`,
      })
    }

    const queue = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(place)
    }

    queue()
    const timer = setTimeout(queue, 80)
    window.addEventListener('resize', queue)
    window.addEventListener('scroll', queue, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('resize', queue)
      window.removeEventListener('scroll', queue)
    }
  }, [hoveredDoor, doorReveal])

  useEffect(() => {
    const nodes = storyItems.current.filter(Boolean)
    if (!nodes.length) return
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (!visible.length) return
      visible.sort((a, b) => Math.abs(a.boundingClientRect.top - innerHeight * .5) - Math.abs(b.boundingClientRect.top - innerHeight * .5))
      setStoryIndex(Number(visible[0].target.dataset.index || 0))
    }, { rootMargin: '-38% 0px -38% 0px', threshold: [0, .2, .6, 1] })
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [story.length])

  const activeStory = story[storyIndex] || story[0]
  const activeYear = yearFromPeriod(activeStory?.period)
  const activeRoom = hoveredDoor == null ? null : FINANCE_ROOMS[hoveredDoor]

  const enterRoom = (slug) => {
    if (openingDoor) return
    setOpeningDoor(slug)
    setTimeout(() => router.push(`/work/${slug}`), 720)
  }

  const go = (id) => {
    setMenu(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={s.root} data-mode={dark ? 'dark' : 'light'}>
      <div className={`${s.loader} ${loaded ? s.loaderGone : ''}`} aria-hidden="true">
        <div className={s.loaderBg} />
        <div className={s.loaderStack}>
          {['Deepak Chandra', ...FINANCE_ROOMS.map((r) => r.label)].map((x, i) => <div key={x} style={{ '--k': i }}>{x}</div>)}
        </div>
        <div className={s.loaderHud}><span>Deepak Chandra · Portfolio</span><span>M&A · Private Markets · Strategic Finance</span></div>
        <div className={s.loaderBottom}><small>Opening the work</small><div><i /></div></div>
      </div>

      <header className={s.header}>
        <div className={s.shell}>
          <div className={s.headerInner}>
            <button className={s.brand} onClick={() => go('home')}>DC</button>
            <nav className={s.nav}>
              <button onClick={() => go('home')}>Home</button>
              {FINANCE_ROOMS.slice(0, 5).map((r) => <button key={r.slug} onClick={() => router.push(`/work/${r.slug}`)}>{r.label}</button>)}
              <button onClick={() => go('about')}>My story</button>
              <button onClick={() => go('contact-footer')}>Contact</button>
            </nav>
            <div className={s.headerRight}>
              <div className={s.clock} aria-label="Local time">
                <span>Local time</span><strong>{time}</strong><i>•</i><span>{date}</span>
              </div>
              <button className={s.menuButton} onClick={() => setMenu(true)}><Menu size={16} /><span>Menu</span></button>
            </div>
          </div>
        </div>
      </header>

      <PullCord dark={dark} setDark={setDark} />

      {menu && (
        <div className={s.mobileMenu}>
          <div className={s.mobileMenuTop}><strong>Deepak Chandra</strong><button onClick={() => setMenu(false)}><X size={18} /></button></div>
          <div className={s.mobileMenuLinks}>
            <button onClick={() => go('home')}>Home</button>
            {FINANCE_ROOMS.map((r, i) => <button key={r.slug} onClick={() => router.push(`/work/${r.slug}`)}><span>0{i + 1}</span>{r.label}</button>)}
            <button onClick={() => go('about')}><span>06</span>My story</button>
            <button onClick={() => go('contact-footer')}><span>07</span>Contact</button>
          </div>
        </div>
      )}

      <main>
        <section id="home" className={s.hero}>
          <div className={s.heroVig} />
          <div className={s.heroStage}>
            <div className={s.figure}>
              {owner.portraitUrl ? (
                <img
                  src={owner.portraitUrl}
                  alt=""
                  style={{ objectPosition: `${owner.portraitFocal?.x ?? 50}% ${owner.portraitFocal?.y ?? 30}%` }}
                />
              ) : (
                <div className={s.figurePlaceholder}><span>DC</span><small>YOUR PORTRAIT</small></div>
              )}
              <button className={s.figureCard} onClick={() => setAbility(true)}>My ability card</button>
            </div>
          </div>

          <div className={`${s.shell} ${s.heroContent}`}>
            <div className={s.heroLeft}>
              <p className={s.eyebrow}>Finance professional</p>
              <h1 className={s.heroTitle}>
                <span>Hi, I&apos;m {owner.name?.split(' ')[0] || 'Deepak'}.</span>
                <span className={s.soft}>I work in</span>
                <RoleCalendar index={role} />
              </h1>
              <div className={s.ctas}>
                {owner.email ? <a className={s.pillDark} href={`mailto:${owner.email}`}>Start a conversation <b><ArrowRight size={15} /></b></a> : <button className={s.pillDark} onClick={() => go('contact-footer')}>Start a conversation <b><ArrowRight size={15} /></b></button>}
                <button className={s.pillOutline} onClick={() => go('works')}>See my work</button>
              </div>
            </div>
          </div>

          <div className={`${s.shell} ${s.heroBar}`}>
            <span>Strategic finance &amp; M&amp;A</span>
            <span className={s.mid}>Delhi NCR · India</span>
            <span>Scroll to explore <i>↓</i></span>
          </div>
        </section>

        <section id="works" ref={doorsRef} className={`${s.doors} ${doorReveal ? s.doorsReveal : ''} ${hoveredDoor != null ? s.doorsFocus : ''}`}>
          <div className={s.doorsTexture} />
          <div className={s.doorsPin}>
            <div ref={doorsWallRef} className={`${s.shell} ${s.doorsWall}`}>
              <h2 className={s.srOnly}>My work, one door per finance discipline</h2>
              <p className={s.paint}>Capital gets interesting <br />behind the doors</p>
              <p className={s.doorsHint}>Swipe along the wall</p>
              <div data-door-info className={`${s.doorInfo} ${activeRoom && doorInfoStyle.left ? s.doorInfoOn : ''}`} style={doorInfoStyle}>
                <h3>{activeRoom?.label || ''}</h3>
                <p>{activeRoom?.tagline || activeRoom?.description || ''}</p>
                <ul>{activeRoom?.bullets?.slice(0, 5).map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
              <div className={s.doorDots}>{FINANCE_ROOMS.map((r, i) => <i key={r.slug} className={hoveredDoor === i ? s.dotOn : ''} />)}</div>
              <ul className={s.doorsRow}>
                {FINANCE_ROOMS.map((room, i) => (
                  <FinanceDoor
                    key={room.slug}
                    room={{ ...room, count: roomCounts[room.slug] || 0 }}
                    index={i}
                    reveal={doorReveal}
                    hovered={hoveredDoor === i}
                    opening={openingDoor === room.slug}
                    onHover={setHoveredDoor}
                    onOpen={enterRoom}
                    unitRef={(el) => { doorUnits.current[i] = el }}
                  />
                ))}
              </ul>
            </div>
            <div className={s.doorsFloor} />
          </div>
        </section>

        <section id="about" ref={storyRef} className={s.story}>
          <div className={s.storyAmbient}>{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div>
          <div className={s.storyTrack}>
            <div className={s.storyPin}>
              <div className={`${s.shell} ${s.storyStage}`}>
                <div className={s.storyClock}>
                  <ClockTunnel progress={storyProgress} dark={dark} />
                  <p className={s.eyebrow}>My story</p>
                  <h2>Let&apos;s go back in time.</h2>
                  <RollingYear year={activeYear} />
                  <p className={s.storyWhen}>{activeStory?.period}</p>
                  <div className={s.storyMeter}>
                    <span>↶</span><strong>{String(storyIndex + 1).padStart(2, '0')}</strong><i>/ {String(story.length).padStart(2, '0')}</i>
                    <b><em style={{ transform: `scaleX(${story.length > 1 ? storyIndex / (story.length - 1) : 1})` }} /></b>
                  </div>
                </div>

                <div className={s.storyLine}>
                  <span className={s.storyRail} />
                  <span className={s.storyDotTrack}><span className={s.storyDot} /></span>
                  <ol className={s.storyList}>
                    {story.map((item, i) => (
                      <li
                        key={item.id || `${item.title}-${i}`}
                        data-index={i}
                        ref={(el) => { storyItems.current[i] = el }}
                        className={`${s.chapter} ${storyIndex === i ? s.chapterOn : ''}`}
                      >
                        <p>{item.period}</p>
                        <h3>{item.title}</h3>
                        <h4>{item.org}{item.location ? ` · ${item.location}` : ''}</h4>
                        <ul>{(item.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className={s.footerWrap}>
        <footer id="contact-footer" className={s.footer}>
          <div className={s.footerInner}>
            <p className={s.footerEye}><i />Open to serious finance conversations</p>
            <h2>Have a transaction?<span>Let&apos;s think it through.</span></h2>
            <p className={s.footerLead}>M&A, strategic finance, private markets, special situations and investment work where the answer has to survive scrutiny.</p>
            <div className={s.footerCtas}>
              {owner.email ? <a className={s.footerPrimary} href={`mailto:${owner.email}`}>Start a conversation <b><ArrowRight size={16} /></b></a> : <button className={s.footerPrimary} onClick={() => owner.linkedin && window.open(owner.linkedin, '_blank')}>Start a conversation <b><ArrowRight size={16} /></b></button>}
              <button className={s.footerGhost} onClick={() => go('works')}>See my work</button>
            </div>
            <div className={s.footerCols}>
              <div><h3>Work</h3><ul>{FINANCE_ROOMS.map((r) => <li key={r.slug}><button onClick={() => router.push(`/work/${r.slug}`)}>{r.label}</button></li>)}</ul></div>
              <div><h3>Navigate</h3><ul><li><button onClick={() => go('home')}>Home</button></li><li><button onClick={() => go('about')}>My story</button></li><li>{owner.linkedin ? <a href={owner.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : <span>LinkedIn</span>}</li></ul></div>
              <div><h3>Status</h3><ul><li className={s.status}>Focused on finance</li><li className={s.status}>{owner.location}</li><li className={s.status}>Local time {time}</li></ul></div>
            </div>
            <div className={s.footerBottom}>
              <span>© {new Date().getFullYear()} {owner.name}. Designed around the work.</span>
              {owner.resumeUrl && <a href={owner.resumeUrl} target="_blank" rel="noreferrer"><Download size={13} /> Resume</a>}
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
            </div>
          </div>
        </footer>
      </div>

      <BackToTop progress={scrollProgress} />
      <AbilityCard owner={owner} open={ability} onClose={() => setAbility(false)} />
      <div className={`${s.enterVeil} ${openingDoor ? s.enterVeilOn : ''}`} />
    </div>
  )
}
