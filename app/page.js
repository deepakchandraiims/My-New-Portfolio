'use client'

import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import {
  ArrowRight, ArrowUpRight, Download, Mail, Menu, X, Circle,
  BarChart3, Building2, PieChart, Handshake, TrendingUp, BookOpen, Landmark, Target,
  Clock, Check, Sparkles, Linkedin, Github, Search, Calendar, MapPin, Briefcase,
  LineChart, Brain, Layers, Paperclip, Download as DownloadIcon, Eye, Zap, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import { SEED_CONTENT } from '@/lib/portfolio-data'
import { CATEGORY_META, formatBytes, previewUrl } from '@/lib/file-utils'
import { trackEvent } from '@/lib/analytics'
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'

const PORTRAIT = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwxfHxidXNpbmVzc21hbiUyMHN1aXR8ZW58MHx8fGJsYWNrfDE3ODQwMTMxMjR8MA&ixlib=rb-4.1.0&q=85&w=900'

const SiteContext = createContext(SEED_CONTENT)
const useSite = () => useContext(SiteContext) || SEED_CONTENT

/* ============================================================== */
/*                        SHARED PRIMITIVES                        */
/* ============================================================== */

const Kicker = ({ children }) => (
  <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
    <span className="h-px w-8 bg-slate-300" />
    <span>{children}</span>
  </div>
)

const Reveal = ({ children, delay = 0, y = 24, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

const parseMetric = (str) => {
  const m = String(str ?? '').match(/^([^\d.-]*)([\d.,]+)(.*)$/)
  if (!m) return { prefix: '', number: 0, suffix: String(str ?? ''), decimals: 0 }
  const numStr = m[2].replace(/,/g, '')
  const decimals = (numStr.split('.')[1] || '').length
  return { prefix: m[1], number: parseFloat(numStr), suffix: m[3], decimals: Math.min(decimals, 2) }
}

const CountUp = ({ raw, duration = 1600, className = '' }) => {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  const [done, setDone] = useState(false)
  const parsed = useMemo(() => parseMetric(raw), [raw])
  useEffect(() => {
    if (!ref.current || done) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDone(true)
        const start = performance.now()
        const to = parsed.number
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 4)
          setVal(to * eased)
          if (t < 1) requestAnimationFrame(tick)
          else setVal(to)
        }
        requestAnimationFrame(tick)
        io.disconnect()
      }
    }, { threshold: 0.4 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [parsed.number, duration, done])
  const display = parsed.decimals ? val.toFixed(parsed.decimals) : Math.round(val).toLocaleString()
  return (
    <span ref={ref} className={className}>
      <span>{parsed.prefix}</span>
      <span className="tabular-nums">{display}</span>
      <span>{parsed.suffix}</span>
    </span>
  )
}

/* ============================================================== */
/*                             NAV                                 */
/* ============================================================== */

const NAV_LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#story', label: 'About' },
  { href: '#work', label: 'Projects' },
  { href: '#transactions', label: 'Transactions' },
  { href: '#lab', label: 'Investment Lab' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
]

const Nav = ({ onOpenContact, onOpenSearch, recruiterMode, setRecruiterMode }) => {
  const { owner } = useSite()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener('scroll', on); return () => window.removeEventListener('scroll', on)
  }, [])
  const initials = (owner?.name || 'D').split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong border-b border-slate-200/70' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
        {/* Left: logo + name */}
        <a href="#top" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <span className="text-[13px] font-semibold tracking-tight">{initials}</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-[14px] font-semibold tracking-tight text-slate-900 uppercase">{owner?.name}</div>
            <div className="text-[10.5px] text-slate-500">{owner?.role?.split('·')?.slice(0, 3)?.join(' · ')}</div>
          </div>
        </a>

        {/* Center: nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="px-3 py-1.5 text-[13px] text-slate-600 hover:text-blue-600 transition rounded-md">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {owner?.resumeUrl ? (
            <a href={owner.resumeUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('resume_click')} className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] text-slate-700 border border-slate-200 hover:bg-slate-50 transition">
              <Download className="h-3.5 w-3.5" /> Resume
            </a>
          ) : (
            <button onClick={() => alert('Set Resume URL in Admin → Content → Owner.')} className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] text-slate-700 border border-slate-200 hover:bg-slate-50 transition">
              <Download className="h-3.5 w-3.5" /> Resume
            </button>
          )}
          <button onClick={onOpenContact} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition">
            Let&apos;s Talk
          </button>
          <button onClick={() => setMenuOpen((v) => !v)} className="lg:hidden h-9 w-9 rounded-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50">
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur">
          <nav className="max-w-[1400px] mx-auto px-6 py-3 grid grid-cols-2 gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="px-3 py-2 text-[13px] text-slate-700 rounded-md hover:bg-slate-50">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

/* ============================================================== */
/*                     ORBITAL FINANCE SYSTEM                       */
/* ============================================================== */

const ORBIT_NODES = [
  { key: 'valuation',           label: 'VALUATION',          hint: 'DCF · Comps · Precedents', Icon: BarChart3, angle: 90 },
  { key: 'investment-banking',  label: 'INVESTMENT BANKING', hint: 'M&A · ECM · DCM',           Icon: Building2, angle: 45 },
  { key: 'private-equity',      label: 'PRIVATE EQUITY',     hint: 'LBO · Returns · Capital',   Icon: PieChart,  angle: -45 },
  { key: 'ma',                  label: 'M&A',                hint: 'Deal Strategy',             Icon: Handshake, angle: -90 },
  { key: 'financial-modeling',  label: 'FINANCIAL MODELING', hint: '3-Statement · DCF · LBO',   Icon: TrendingUp,angle: -135 },
  { key: 'research',            label: 'RESEARCH',           hint: 'Sector · Industry · Deal',  Icon: BookOpen,  angle: 180 },
  { key: 'capital-markets',     label: 'CAPITAL MARKETS',    hint: 'IPO · Bonds · Structured',  Icon: Landmark,  angle: 135 },
  { key: 'strategy',            label: 'STRATEGY',           hint: 'Corp Dev · Where-to-play',  Icon: Target,    angle: 0 },
]

// Positions node at given angle & radius from center, keeps content upright when parent rotates.
const OrbitNode = ({ node, radius, counterClass }) => {
  const rad = (node.angle * Math.PI) / 180
  const x = Math.cos(rad) * radius
  const y = Math.sin(rad) * radius
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
    >
      <div className={counterClass}>
        <div className="group flex flex-col items-center gap-1.5 cursor-default">
          <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-full glass-strong flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-0.5">
            <div className="absolute inset-0 rounded-full ring-1 ring-blue-500/10 group-hover:ring-blue-500/30 transition" />
            <div className="absolute -inset-1 rounded-full bg-blue-500/0 group-hover:bg-blue-500/10 blur-md transition" />
            <node.Icon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          </div>
          <div className="text-[9px] md:text-[10px] font-semibold tracking-[0.14em] text-slate-700 whitespace-nowrap">
            {node.label}
          </div>
          <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition text-[9px] tracking-wide text-blue-600 whitespace-nowrap">
            {node.hint}
          </div>
        </div>
      </div>
    </div>
  )
}

const OrbitalHero = () => {
  const { owner } = useSite()
  const wrapRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  // Cursor parallax — subtle
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = (e.clientX - cx) / r.width
      const dy = (e.clientY - cy) / r.height
      setTilt({ x: dx * 8, y: dy * 8 })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    window.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { window.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [])

  const inner = ORBIT_NODES.slice(0, 4)
  const outer = ORBIT_NODES.slice(4)

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full aspect-square max-w-[620px] mx-auto"
      style={{ transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0)`, transition: 'transform 300ms ease-out' }}
    >
      {/* Base radial glow */}
      <div className="absolute inset-8 rounded-full bg-blue-500/[0.06] blur-3xl" />
      <div className="absolute inset-16 rounded-full bg-blue-500/[0.05] blur-2xl animate-energy" />

      {/* Orbit ring 1 (outer, main) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, delay: 0.6 }}
        className="absolute inset-0 orbit-ring"
      />
      {/* Orbit ring 2 (inner) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, delay: 0.7 }}
        className="absolute inset-[15%] orbit-ring opacity-70"
      />
      {/* Data orbit (thin ring w/ traveling particles) */}
      <div className="absolute inset-[7%] rounded-full border border-blue-500/10">
        <div className="relative w-full h-full animate-orbit-fast">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div key={deg} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]"
              style={{ transform: `rotate(${deg}deg) translateY(calc(-50% - 0.5px)) translateX(0)` }} />
          ))}
        </div>
      </div>

      {/* Energy ring behind portrait */}
      <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[70%] h-[18%] rounded-[50%] border-2 border-blue-500/25 blur-[1px] animate-energy" />
      <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[10%] rounded-[50%] border border-blue-400/50" />

      {/* Portrait */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.0, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[52%] max-w-[340px] z-20"
      >
        <div className="relative">
          <img
            src={owner?.portraitUrl || PORTRAIT}
            alt={owner?.name}
            className="w-full h-auto aspect-[3/4] object-cover portrait-mask"
            style={{ objectPosition: `${owner?.portraitFocal?.x ?? 50}% ${owner?.portraitFocal?.y ?? 30}%` }}
          />
          <div className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: '0 40px 80px -20px rgba(37,99,235,0.25), 0 0 60px rgba(37,99,235,0.15)' }} />
        </div>
      </motion.div>

      {/* Outer orbit nodes (slower) */}
      <div className="absolute inset-0 animate-orbit-slow z-30">
        {outer.map((n, i) => (
          <motion.div
            key={n.key}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <OrbitNode node={n} radius={280} counterClass="animate-orbit-counter-slow" />
          </motion.div>
        ))}
      </div>

      {/* Inner orbit nodes (main) */}
      <div className="absolute inset-0 animate-orbit z-30">
        {inner.map((n, i) => (
          <motion.div
            key={n.key}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <OrbitNode node={n} radius={210} counterClass="animate-orbit-counter" />
          </motion.div>
        ))}
      </div>

      {/* Floating particles */}
      {[
        { x: 15, y: 30, dx: 30, dy: -20, delay: 0 },
        { x: 80, y: 20, dx: -20, dy: 30, delay: 1 },
        { x: 90, y: 70, dx: -30, dy: -20, delay: 2 },
        { x: 10, y: 75, dx: 25, dy: -30, delay: 3 },
        { x: 50, y: 8, dx: 10, dy: 40, delay: 4 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-blue-500/60 animate-particle"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </motion.div>
  )
}

/* ============================================================== */
/*                             HERO                                 */
/* ============================================================== */

const Hero = ({ onOpenContact }) => {
  const { owner, expertise } = useSite()
  const pill = 'Strategic Finance • M&A • Investment Banking'
  const trusted = ['Goldman Sachs', 'McKinsey & Company', 'BCG', 'Blackstone', 'EY-Parthenon']
  return (
    <section id="top" className="relative pt-24 pb-10 md:pt-28 md:pb-16 overflow-hidden">
      <div className="absolute inset-0 hero-radial" />
      <div className="absolute inset-0 subtle-grid" />
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8 lg:gap-12 items-center">
        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11.5px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {pill}
            </div>
          </motion.div>

          <h1 className="mt-6 font-sans font-semibold tracking-tight text-slate-900 text-[44px] sm:text-[52px] md:text-[60px] lg:text-[64px] leading-[1.03]">
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="block">
              I help companies
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.28 }} className="block">
              make better
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.42 }} className="block text-blue-600">
              capital allocation
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="block text-blue-600">
              decisions.
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.7 }} className="mt-6 max-w-xl text-[15px] text-slate-600 leading-relaxed">
            I combine finance, strategy and technology to solve complex problems — build institutional-grade financial models, evaluate opportunities, and drive impact across M&A, valuation, corporate development and AI-augmented investment workflows.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.85 }} className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#work" className="group inline-flex items-center gap-2 h-11 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-medium shadow-sm shadow-blue-600/25 transition">
              Explore Portfolio
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#transactions" className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-white text-slate-800 border border-slate-200 hover:border-blue-300 hover:text-blue-700 text-[14px] font-medium transition">
              View Transactions
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Trusted across */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }} className="mt-10">
            <div className="text-[10.5px] uppercase tracking-[0.22em] text-slate-400 mb-3">Trusted across</div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2 opacity-70">
              {trusted.map((t) => (
                <span key={t} className="font-serif text-[15px] text-slate-500 tracking-tight">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: orbital system */}
        <div className="relative">
          <OrbitalHero />
        </div>
      </div>
    </section>
  )
}

/* ============================================================== */
/*                    METRICS + LATEST ACTIVITY                    */
/* ============================================================== */

const MetricsStrip = () => {
  const { owner, projects } = useSite()
  const metrics = owner?.metrics || []
  const activity = (projects || []).slice(0, 3).map((p, i) => ({
    label: p.title.length > 42 ? p.title.slice(0, 42) + '…' : p.title,
    category: p.category,
    status: i === 1 ? 'In Progress' : 'Completed',
  }))
  return (
    <section className="relative max-w-[1400px] mx-auto px-6 md:px-10">
      <Reveal>
        <div className="glass-strong rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.slice(0, 4).map((m, i) => (
              <div key={m.label} className="relative">
                {i > 0 && <div className="hidden md:block absolute left-0 top-1 bottom-1 w-px bg-slate-200" />}
                <div className="md:pl-6">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-[26px] md:text-[30px] font-semibold text-slate-900 tracking-tight leading-none">
                    <CountUp raw={m.value} />
                  </div>
                  <div className="mt-2 text-[11.5px] text-slate-500 leading-snug max-w-[130px]">{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:border-l lg:border-slate-200 lg:pl-8">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] uppercase tracking-[0.22em] text-slate-500">Latest Activity</div>
              <a href="#work" className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1">View all activity <ArrowRight className="h-3 w-3" /></a>
            </div>
            <ul className="mt-4 space-y-2.5">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[13px] text-slate-700 flex-1 truncate">{a.label}</span>
                  <span className={`text-[11px] ${a.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>— {a.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ============================================================== */
/*                       MY STORY TIMELINE                          */
/* ============================================================== */

const MyStory = () => {
  const stages = [
    { t: 'I Started', d: 'I started with numbers.', Icon: BarChart3 },
    { t: 'I Learned', d: 'I learned businesses.', Icon: BookOpen },
    { t: 'I Built',   d: 'I built financial models.', Icon: TrendingUp },
    { t: 'I Executed',d: 'I worked on acquisitions.', Icon: Handshake },
    { t: 'I Automated', d: 'I began using AI.', Icon: Brain },
    { t: 'I Combine', d: 'Now I combine finance with technology.', Icon: Sparkles },
  ]
  return (
    <section id="story" className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
      <div className="flex items-center gap-3 mb-10">
        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <h2 className="text-[22px] md:text-[26px] font-semibold text-slate-900 tracking-tight">My Story</h2>
      </div>
      <div className="relative">
        <div className="absolute left-6 right-6 top-6 h-px bg-slate-200 hidden md:block" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4">
          {stages.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm z-10">
                  <s.Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-3 text-[13.5px] font-semibold text-slate-900">{s.t}</div>
                <div className="mt-1 text-[11.5px] text-slate-500 leading-snug max-w-[130px]">{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================== */
/*                       FEATURED PROJECTS                          */
/* ============================================================== */

const CATEGORY_TINT = {
  'M&A': 'from-blue-500/20 to-indigo-500/10',
  'Valuation': 'from-violet-500/20 to-purple-500/10',
  'Corporate Strategy': 'from-emerald-500/20 to-teal-500/10',
  'AI Automation': 'from-cyan-500/20 to-sky-500/10',
  'Dashboards': 'from-amber-500/20 to-orange-500/10',
  'Market Research': 'from-rose-500/20 to-pink-500/10',
}

const ProjectCard = ({ p, onOpen }) => (
  <motion.button
    onClick={() => onOpen(p)}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="group text-left rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5 transition-all"
  >
    <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${CATEGORY_TINT[p.category] || 'from-slate-500/15 to-slate-500/5'}`}>
      {p.coverImageUrl ? (
        <img src={p.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-[130px] text-slate-900/[0.06] leading-none select-none">{p.coverEmoji}</span>
        </div>
      )}
      <div className="absolute top-3 left-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-700 bg-white/85 backdrop-blur px-2.5 py-1 rounded-md border border-blue-100">{p.category}</div>
      </div>
    </div>
    <div className="p-5">
      <div className="text-[15.5px] font-semibold text-slate-900 leading-tight">{p.title}</div>
      <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed line-clamp-2">{p.executiveSummary}</div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
        <span>{p.industry?.split(' · ')[0] || p.industry}</span>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <span>{p.year}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-1">
        {(p.tools || []).slice(0, 3).map((t) => (
          <span key={t} className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">{t}</span>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 text-[13px] font-medium group-hover:gap-2 transition-all">
        <span>View Project</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </motion.button>
)

const Projects = ({ onOpenProject }) => {
  const { projects, categories } = useSite()
  const [filter, setFilter] = useState('All')
  const visible = (projects || []).filter((p) => !p.hidden)
  const filtered = filter === 'All' ? visible : visible.filter((p) => p.category === filter)
  return (
    <section id="work" className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div>
          <h2 className="text-[26px] md:text-[32px] font-semibold text-slate-900 tracking-tight">Featured Projects</h2>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(categories || []).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition ${
                filter === c
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <a href="#work" className="text-[13px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">View all projects <ArrowRight className="h-3.5 w-3.5" /></a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.slice(0, 8).map((p) => (<ProjectCard key={p.id} p={p} onOpen={onOpenProject} />))}
      </div>
    </section>
  )
}

/* ============================================================== */
/*                       INVESTMENT LAB                             */
/* ============================================================== */

const LAB_ALLOCATION = [
  { name: 'Equities',      value: 62.3, color: '#2563EB' },
  { name: 'Mutual Funds',  value: 15.4, color: '#60A5FA' },
  { name: 'Cash',          value: 8.7,  color: '#93C5FD' },
  { name: 'Fixed Income',  value: 7.7,  color: '#0EA5E9' },
  { name: 'Gold',          value: 4.4,  color: '#F59E0B' },
  { name: 'Others',        value: 1.5,  color: '#CBD5E1' },
]

const LAB_HOLDINGS = [
  { name: 'HDFC Bank',        weight: '19.48%', delta: '+23.6%', up: true },
  { name: 'Infosys',          weight: '12.31%', delta: '+18.2%', up: true },
  { name: 'ICICI Bank',       weight: '10.97%', delta: '+15.7%', up: true },
  { name: 'Axis Mutual Fund', weight: '8.42%',  delta: '+12.1%', up: true },
]

const LAB_TABS = ['Investment Memos', 'Risk Metrics', 'Monte Carlo', 'Attribution', 'Letters']

const InvestmentLab = () => {
  return (
    <section id="lab" className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-slate-100">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <h2 className="text-[26px] md:text-[32px] font-semibold text-slate-900 tracking-tight">Investment Lab Snapshot</h2>
        <a href="#lab" className="text-[13px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">Enter Investment Lab <ArrowRight className="h-3.5 w-3.5" /></a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <Reveal>
          <div className="glass-strong rounded-2xl p-6 h-full">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Portfolio Value</div>
            <div className="mt-3 text-[34px] font-semibold text-slate-900 tracking-tight leading-none">
              <CountUp raw="1.17" /><span className="text-[22px] text-slate-500 ml-1">Cr</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">₹ Indian Rupees</div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Absolute Return</div>
                <div className="text-[16px] font-semibold text-emerald-600 mt-0.5">+17.42%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">CAGR</div>
                <div className="text-[16px] font-semibold text-emerald-600 mt-0.5">+14.08%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Holdings</div>
                <div className="text-[16px] font-semibold text-slate-900 mt-0.5">9</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Sectors</div>
                <div className="text-[16px] font-semibold text-slate-900 mt-0.5">6</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Asset Allocation */}
        <Reveal delay={0.08}>
          <div className="glass-strong rounded-2xl p-6 h-full">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Asset Allocation</div>
            <div className="mt-4 grid grid-cols-[120px_1fr] gap-4 items-center">
              <div className="relative w-full h-[120px]">
                <ResponsiveContainer>
                  <RPieChart>
                    <Pie data={LAB_ALLOCATION} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2} stroke="none">
                      {LAB_ALLOCATION.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RTooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11 }} formatter={(v) => `${v}%`} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5">
                {LAB_ALLOCATION.map((a) => (
                  <li key={a.name} className="flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                      <span className="text-slate-700">{a.name}</span>
                    </span>
                    <span className="text-slate-500 font-mono tabular-nums">{a.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Top Holdings */}
        <Reveal delay={0.16}>
          <div className="glass-strong rounded-2xl p-6 h-full">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Top Holdings</div>
            <ul className="mt-4 space-y-3">
              {LAB_HOLDINGS.map((h) => (
                <li key={h.name} className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-900">{h.name}</span>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-slate-500 font-mono">{h.weight}</span>
                    <span className="text-emerald-600 font-medium">{h.delta}</span>
                  </div>
                </li>
              ))}
            </ul>
            <a href="#lab" className="mt-4 inline-flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700">View all holdings <ArrowRight className="h-3 w-3" /></a>
          </div>
        </Reveal>

        {/* Journal Highlight */}
        <Reveal delay={0.24}>
          <div className="glass-strong rounded-2xl p-6 h-full">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Journal Highlight</div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Losing position
            </div>
            <div className="mt-3 text-[17px] font-semibold text-slate-900 tracking-tight leading-tight">Paytm (One97)</div>
            <div className="mt-1 text-[13px] text-slate-600">Exited at <span className="text-rose-600 font-medium">-28.14%</span></div>
            <p className="mt-3 text-[12px] text-slate-600 leading-relaxed">
              Documented loss. Important lesson in valuation &amp; risk management — governance signals were louder than growth metrics, in hindsight.
            </p>
            <a href="#lab" className="mt-4 inline-flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700">View Journal <ArrowRight className="h-3 w-3" /></a>
          </div>
        </Reveal>
      </div>

      {/* Tabs */}
      <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-1 flex items-center gap-1 flex-wrap">
        {LAB_TABS.map((t, i) => {
          const Icon = [FileText, BarChart3, PieChart, LineChart, BookOpen][i]
          return (
            <button key={t} className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition">
              <Icon className="h-3.5 w-3.5" /> {t}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ============================================================== */
/*                          TESTIMONIALS                            */
/* ============================================================== */

const Testimonials = () => {
  const { testimonials } = useSite()
  const list = testimonials || []
  if (list.length === 0) return null
  return (
    <section className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-slate-100">
      <div className="mb-10 max-w-2xl">
        <Kicker>What people say</Kicker>
        <h2 className="mt-3 text-[26px] md:text-[32px] font-semibold text-slate-900 tracking-tight">Selected references.</h2>
        <p className="mt-2 text-[13.5px] text-slate-500">From partners, principals and MDs I have worked with on transactions and strategy engagements.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {list.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08}>
            <div className="relative p-6 md:p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 transition h-full">
              <div className="absolute top-4 right-5 font-serif text-[80px] text-blue-100 leading-none select-none">&ldquo;</div>
              <p className="relative text-[15.5px] text-slate-800 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-semibold text-[13px]">
                  {t.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[11.5px] text-slate-500">{t.title} · {t.company}</div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ============================================================== */
/*                    CASE STUDY DIALOG                             */
/* ============================================================== */

const CaseStudyDialog = ({ project, open, onClose, onOpenAnother }) => {
  const { projects } = useSite()
  const [attachedFiles, setAttachedFiles] = useState([])
  useEffect(() => {
    if (!open || !project) { setAttachedFiles([]); return }
    fetch(`/api/files?projectId=${encodeURIComponent(project.id)}`)
      .then((r) => r.json()).then((d) => Array.isArray(d) && setAttachedFiles(d)).catch(() => {})
  }, [open, project])
  if (!project) return null
  const related = (projects || []).filter((p) => p.id !== project.id && p.category === project.category && !p.hidden).slice(0, 2)
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl p-0 gap-0 bg-white border-slate-200 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className={`aspect-[21/8] w-full ${project.coverImageUrl ? '' : `bg-gradient-to-br ${CATEGORY_TINT[project.category] || 'from-slate-500/15 to-slate-500/5'}`} relative overflow-hidden`}>
          {project.coverImageUrl ? (
            <img src={project.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-serif text-[240px] text-slate-900/[0.06] leading-none select-none">{project.coverEmoji}</div>
            </div>
          )}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-700 border border-blue-100">{project.category}</div>
            <div className="bg-white/90 backdrop-blur rounded-md px-2.5 py-1 text-[10.5px] text-slate-700 border border-slate-200">{project.industry}</div>
            <div className="bg-white/90 backdrop-blur rounded-md px-2.5 py-1 text-[10.5px] text-slate-700 border border-slate-200">{project.year}</div>
          </div>
        </div>
        <div className="p-8 md:p-12">
          <DialogHeader className="text-left space-y-3">
            <DialogTitle className="text-[26px] md:text-[36px] font-semibold text-slate-900 tracking-tight leading-tight">{project.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {project.readingMinutes} min read</div>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> {project.impact}</div>
          </div>
          {(project.metrics || []).length > 0 && (
            <div className="mt-8 grid grid-cols-3 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
              {project.metrics.map((m) => (
                <div key={m.k}>
                  <div className="text-[22px] md:text-[26px] font-semibold text-slate-900">{m.v}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{m.k}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 p-5 rounded-xl border border-blue-100 bg-blue-50/60">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> Recruiter summary
            </div>
            <p className="mt-3 text-[15px] text-slate-800 leading-relaxed">{project.executiveSummary}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">Situation &amp; objective</div>
              <p className="mt-3 text-[14px] text-slate-700 leading-relaxed">{project.problem}</p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">Deliverables</div>
              <ul className="mt-3 space-y-1.5">
                {(project.deliverables || []).map((d) => (
                  <li key={d} className="text-[14px] text-slate-700 flex gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{d}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">Tools &amp; platforms</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(project.tools || []).map((t) => (
                  <span key={t} className="text-[12px] px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Methodology &amp; analysis</div>
            <ol className="mt-4 space-y-3">
              {(project.approach || []).map((a, i) => (
                <li key={i} className="flex gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[11px] font-mono text-blue-700 shrink-0">{i + 1}</div>
                  <p className="text-[14.5px] text-slate-800 leading-relaxed">{a}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-10 p-6 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Key insight</div>
            <p className="mt-3 font-serif text-[22px] leading-snug italic text-slate-800">&ldquo;{project.learnings}&rdquo;</p>
          </div>
          {attachedFiles.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500">
                <Paperclip className="h-3.5 w-3.5 text-blue-600" /> Documents &amp; downloads
                <span className="text-slate-400">·</span>
                <span>{attachedFiles.length} file{attachedFiles.length === 1 ? '' : 's'}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachedFiles.map((f) => {
                  const meta = CATEGORY_META[f.category] || CATEGORY_META.other
                  const pUrl = previewUrl(f)
                  return (
                    <div key={f.id} className="rounded-xl overflow-hidden bg-white border border-slate-200 hover:border-blue-200 transition">
                      <div className="flex gap-4 p-4">
                        <div className={`h-14 w-14 rounded-lg bg-gradient-to-br ${meta.accent} flex items-center justify-center shrink-0 relative overflow-hidden`}>
                          {f.category === 'image' ? (
                            <img src={f.publicUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <span className="font-serif text-2xl text-white/80">{meta.emoji}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">{meta.label} · {formatBytes(f.size)}</div>
                          <div className="mt-0.5 text-[13.5px] font-medium text-slate-900 truncate">{f.label || f.originalName}</div>
                          <div className="mt-2 flex items-center gap-2">
                            <a href={pUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100"><Eye className="h-3 w-3" /> Preview</a>
                            <a href={f.publicUrl} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200"><DownloadIcon className="h-3 w-3" /> Download</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-4">Related work</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {related.map((r) => (
                  <button key={r.id} onClick={() => onOpenAnother(r)} className="text-left p-4 rounded-lg bg-white border border-slate-200 hover:border-blue-200 hover:bg-slate-50 transition group">
                    <div className="text-[10px] uppercase tracking-widest text-blue-700">{r.category}</div>
                    <div className="mt-1 text-[15px] font-semibold text-slate-900 flex items-center justify-between gap-2">
                      {r.title}
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================== */
/*                    SELECTED TRANSACTIONS                         */
/* ============================================================== */

const typeBadgeClass = (t) => {
  const map = {
    'IPO': 'bg-blue-50 text-blue-700 border-blue-100',
    'Valuation': 'bg-violet-50 text-violet-700 border-violet-100',
    'M&A · Sell-Side': 'bg-rose-50 text-rose-700 border-rose-100',
    'M&A · Buy-Side': 'bg-rose-50 text-rose-700 border-rose-100',
    'LBO · Buy-Side': 'bg-orange-50 text-orange-700 border-orange-100',
    'Corporate Strategy': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Corporate Development': 'bg-teal-50 text-teal-700 border-teal-100',
    'Market Research': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    'Operating Model': 'bg-sky-50 text-sky-700 border-sky-100',
    'AI Workflow': 'bg-cyan-50 text-cyan-700 border-cyan-100',
    'Valuation · Growth Equity': 'bg-violet-50 text-violet-700 border-violet-100',
  }
  return map[t] || 'bg-slate-50 text-slate-700 border-slate-200'
}

const Tombstone = ({ t, projects, onOpenProject }) => {
  const linked = t.projectId ? (projects || []).find((p) => p.id === t.projectId) : null
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{t.dealNumber} · {t.year}</div>
        <div className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md border ${typeBadgeClass(t.type)}`}>{t.type}</div>
      </div>
      <div className="mt-5 mb-1 text-center">
        <div className="font-semibold text-[19px] md:text-[20px] leading-tight tracking-tight text-slate-900">{t.target}</div>
        <div className="mt-1.5 text-[12px] text-slate-500 max-w-[28ch] mx-auto leading-snug">{t.subtitle}</div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
        <span className="h-px w-6 bg-slate-200" /><span>Transaction summary</span><span className="h-px w-6 bg-slate-200" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        <div><div className="text-[10px] uppercase tracking-widest text-slate-400">Sector</div><div className="text-slate-800 mt-0.5">{t.sector}</div></div>
        <div><div className="text-[10px] uppercase tracking-widest text-slate-400">Size / metric</div><div className="text-blue-700 font-mono mt-0.5">{t.size}</div></div>
        <div className="col-span-2"><div className="text-[10px] uppercase tracking-widest text-slate-400">Role</div><div className="text-slate-800 mt-0.5">{t.role}</div></div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 text-[12px] text-slate-600 leading-relaxed">{t.outcome}</div>
      {(t.tools || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {t.tools.map((tool) => (<span key={tool} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">{tool}</span>))}
        </div>
      )}
      {linked && (
        <div className="mt-3 flex items-center gap-1 text-[11px] text-blue-600 font-medium">
          <span>View full case study</span><ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </>
  )
  const cls = 'group relative p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5 transition text-left w-full h-full'
  return linked
    ? <motion.button whileHover={{ y: -3 }} transition={{ duration: 0.3 }} onClick={() => onOpenProject(linked)} className={cls}>{body}</motion.button>
    : <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3 }} className={cls}>{body}</motion.div>
}

const SelectedTransactions = ({ onOpenProject }) => {
  const { transactions, projects } = useSite()
  const list = transactions || []
  if (list.length === 0) return null
  return (
    <section id="transactions" className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-slate-100">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div>
          <Kicker>Selected transactions</Kicker>
          <h2 className="mt-3 text-[26px] md:text-[36px] font-semibold text-slate-900 tracking-tight">Deal experience. <span className="text-slate-400">A public credentials page.</span></h2>
          <p className="mt-3 max-w-2xl text-[14px] text-slate-600">Tombstone-style summary of representative transactions and strategic engagements. Confidential clients are anonymised; every mandate below has a corresponding artefact — model, memo, deck — available on request.</p>
        </div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500">{list.length} representative mandates</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((t, i) => (<Reveal key={t.id} delay={0.05 + Math.min(i, 6) * 0.04}><Tombstone t={t} projects={projects} onOpenProject={onOpenProject} /></Reveal>))}
      </div>
    </section>
  )
}

/* ============================================================== */
/*                       EXPERIENCE + EDUCATION                     */
/* ============================================================== */

const ExperienceEducation = () => {
  const { experience, education } = useSite()
  return (
    <section id="experience" className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-10">
        <div>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[24px] md:text-[30px] font-semibold text-slate-900 tracking-tight">Experience</h2>
            <a href="#experience" className="text-[12.5px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">View full timeline <ArrowRight className="h-3.5 w-3.5" /></a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(experience || []).map((e, i) => (
              <Reveal key={e.company + i} delay={i * 0.06}>
                <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-sm transition h-full">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-widest text-slate-500">
                    <Calendar className="h-3 w-3" /> {e.period}
                  </div>
                  <div className="mt-2 text-[16px] font-semibold text-slate-900 tracking-tight">{e.role}</div>
                  <div className="text-[12.5px] text-blue-700">{e.company}</div>
                  <div className="mt-1 text-[11.5px] text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</div>
                  <ul className="mt-3 space-y-1.5">
                    {(e.bullets || []).map((b, j) => (
                      <li key={j} className="text-[12.5px] text-slate-700 leading-relaxed flex gap-2">
                        <Circle className="h-1.5 w-1.5 mt-1.5 text-blue-500 fill-blue-500 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[24px] md:text-[30px] font-semibold text-slate-900 tracking-tight">Education</h2>
            <a href="#experience" className="text-[12.5px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></a>
          </div>
          <div className="space-y-3">
            {(education || []).map((e, i) => (
              <Reveal key={e.id} delay={i * 0.08}>
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10.5px] font-mono uppercase tracking-widest text-slate-500">{e.period}</div>
                  <div className="mt-1.5 text-[15px] font-semibold text-slate-900">{e.institution}</div>
                  <div className="mt-0.5 text-[12.5px] text-blue-700">{e.degree}</div>
                  {e.details && <div className="mt-2 text-[11.5px] text-slate-600 leading-relaxed">{e.details}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================== */
/*                       ASPIRATIONS + CONTACT                      */
/* ============================================================== */

const AspirationalFirms = () => {
  const { aspirations } = useSite()
  const groups = aspirations || []
  if (groups.length === 0) return null
  return (
    <section className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-slate-100">
      <div className="mb-8">
        <Kicker>Ambition</Kicker>
        <h2 className="mt-3 text-[26px] md:text-[32px] font-semibold text-slate-900 tracking-tight">The firms I hold my work to.</h2>
        <p className="mt-2 text-[13.5px] text-slate-500">The bar these firms set is the bar I set.</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-blue-700 pb-3 mb-3 border-b border-slate-100">{g.group}</div>
            <ul className="space-y-2">
              {g.firms.map((f) => (
                <li key={f} className="font-serif text-[15px] text-slate-700 tracking-tight">{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

const ContactSection = ({ onOpenContact }) => {
  const { owner } = useSite()
  return (
    <section id="contact" className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-32 border-t border-slate-100">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
        <div className="relative">
          <Kicker><span className="text-blue-100/80">Contact</span></Kicker>
          <h2 className="mt-4 text-[36px] md:text-[52px] font-semibold tracking-tight leading-[1.05] max-w-3xl">Let&apos;s build the next chapter together.</h2>
          <p className="mt-6 max-w-xl text-[15px] text-blue-100">{owner?.bio}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onOpenContact} className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-white text-blue-700 hover:bg-blue-50 text-[14px] font-medium transition">
              <Mail className="h-4 w-4" /> Send a message
            </button>
            {owner?.linkedin && (
              <a href={owner.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[14px] transition">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {owner?.email && (
              <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-white/20 hover:bg-white/10 text-white text-[14px] transition">
                {owner.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================== */
/*                    CONTACT DIALOG (unchanged flow)               */
/* ============================================================== */

const ContactDialog = ({ open, onClose, recruiterMode }) => {
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', message: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setSending(true)
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, recruiterMode }) })
      if (res.ok) { setDone(true); setTimeout(() => { setDone(false); onClose() }, 1600) }
    } finally { setSending(false) }
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-white border-slate-200">
        <DialogHeader><DialogTitle className="text-[22px] font-semibold tracking-tight text-slate-900">Send a message</DialogTitle></DialogHeader>
        {done ? (
          <div className="py-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100"><Check className="h-5 w-5 text-emerald-600" /></div>
            <div className="mt-4 text-[16px] font-medium text-slate-900">Received. I&apos;ll get back within 24 hours.</div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              <input placeholder="Your role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <textarea required rows={5} placeholder="What are you hiring for / what would you like to discuss?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            <div className="flex items-center justify-end pt-2">
              <Button type="submit" disabled={sending} className="bg-blue-600 text-white hover:bg-blue-700 h-10 rounded-md">{sending ? 'Sending…' : 'Send'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================== */
/*                             FOOTER                               */
/* ============================================================== */

const Footer = () => {
  const { owner } = useSite()
  return (
    <footer className="border-t border-slate-100 py-10 mt-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-wrap items-center justify-between gap-4 text-[12px] text-slate-500">
        <div>© {new Date().getFullYear()} {owner?.name}. Designed &amp; built as a product, not a template.</div>
        <div className="flex items-center gap-4">
          {owner?.linkedin && <a href={owner.linkedin} className="hover:text-blue-700 transition">LinkedIn</a>}
          {owner?.email && <a href={`mailto:${owner.email}`} className="hover:text-blue-700 transition">{owner.email}</a>}
          <a href="/admin" className="hover:text-blue-700 transition">Admin</a>
          <span className="font-mono">v2025.06 · Phase 6A</span>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================== */
/*                              APP                                 */
/* ============================================================== */

function App() {
  const [content, setContent] = useState(SEED_CONTENT)
  const [recruiterMode, setRecruiterMode] = useState(false)
  const [activeProject, setActiveProject] = useState(null)
  const [projectOpen, setProjectOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/content').then((r) => r.json()).then((d) => { if (!cancelled && d && !d.error) setContent({ ...SEED_CONTENT, ...d }) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => { trackEvent('pageview') }, [])

  const openProject = (p) => {
    setActiveProject(p)
    setProjectOpen(true)
    trackEvent('project_view', { projectId: p.id, projectTitle: p.title })
  }
  const closeProject = () => { setProjectOpen(false); setTimeout(() => setActiveProject(null), 200) }

  return (
    <SiteContext.Provider value={content}>
      <main className="relative min-h-screen bg-white text-slate-900">
        <Nav onOpenContact={() => setContactOpen(true)} recruiterMode={recruiterMode} setRecruiterMode={setRecruiterMode} />
        <Hero onOpenContact={() => setContactOpen(true)} />
        <MetricsStrip />
        <MyStory />
        <Projects onOpenProject={openProject} />
        <SelectedTransactions onOpenProject={openProject} />
        <InvestmentLab />
        <ExperienceEducation />
        <Testimonials />
        <AspirationalFirms />
        <ContactSection onOpenContact={() => setContactOpen(true)} />
        <Footer />
        <CaseStudyDialog project={activeProject} open={projectOpen} onClose={closeProject} onOpenAnother={(p) => setActiveProject(p)} />
        <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} recruiterMode={recruiterMode} />
      </main>
    </SiteContext.Provider>
  )
}

export default App
