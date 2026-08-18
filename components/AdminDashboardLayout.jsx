'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowRight, BadgeCheck, BarChart3, BookOpen, Briefcase, Building2,
  CheckCircle2, ChevronDown, Database, Download, ExternalLink, Eye, FolderOpen,
  Globe, GraduationCap, Handshake, KeyRound, LayoutDashboard, LineChart, LogOut,
  Menu, MousePointerClick, Quote, Settings, ShieldAlert, Sparkles, Tag, User,
  Users, Wallet, X,
} from 'lucide-react'

const TOKEN_KEY = 'portfolio_admin_token'

const CONTENT_LABELS = {
  owner: 'Owner',
  chapters: 'Chapters',
  expertise: 'Expertise',
  projects: 'Projects',
  transactions: 'Transactions',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  testimonials: 'Testimonials',
  aspirations: 'Aspirations',
  seo: 'SEO',
  danger: 'Danger zone',
}

const PAGE_TITLES = {
  dashboard: ['Dashboard', 'Overview of your portfolio website'],
  owner: ['Hero Profile', 'Update your portrait, positioning, headline and personal information'],
  chapters: ['About / Story', 'Edit the narrative and story sections shown on your portfolio'],
  projects: ['Featured Projects', 'Manage recruiter-facing case studies and featured work'],
  transactions: ['Transactions', 'Manage selected transactions and deal tombstones'],
  experience: ['Experience', 'Add or edit your professional experience'],
  education: ['Education', 'Manage degrees, institutions and academic details'],
  certifications: ['Certifications', 'Manage credentials and professional coursework'],
  testimonials: ['Testimonials', 'Manage selected references and professional quotes'],
  aspirations: ['Aspirational Firms', 'Edit the institutions displayed in your credentials wall'],
  expertise: ['Expertise', 'Manage your headline expertise and focus areas'],
  seo: ['SEO Settings', 'Control search metadata and social preview settings'],
  analytics: ['Analytics', 'Track pageviews, visitors, projects and resume engagement'],
  files: ['Files & Storage', 'Upload and manage project files stored in Supabase'],
  danger: ['Settings', 'Administrative and reset controls'],
}

function cls(...parts) {
  return parts.filter(Boolean).join(' ')
}

function compactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value))
}

function StatCard({ icon: Icon, value, label, foot, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_30px_-24px_rgba(15,23,42,.35)]">
      <div className="flex items-start gap-4">
        <div className={cls('h-12 w-12 shrink-0 rounded-2xl border flex items-center justify-center', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[25px] font-semibold tracking-tight text-slate-950 tabular-nums">{value}</div>
          <div className="mt-0.5 text-[12px] font-medium text-slate-600">{label}</div>
          <div className="mt-2 text-[10.5px] text-emerald-600">{foot}</div>
        </div>
      </div>
    </div>
  )
}

function DashboardHome({ token, onNavigate, onOpenTool }) {
  const [analytics, setAnalytics] = useState(null)
  const [content, setContent] = useState(null)
  const [market, setMarket] = useState(null)
  const [portfolio, setPortfolio] = useState(null)

  useEffect(() => {
    let cancelled = false
    const headers = token ? { 'x-admin-token': token } : {}
    Promise.allSettled([
      fetch('/api/analytics/summary?days=30', { headers }).then((r) => r.ok ? r.json() : null),
      fetch('/api/content').then((r) => r.ok ? r.json() : null),
      fetch('/api/market/config', { headers }).then((r) => r.ok ? r.json() : null),
      fetch('/api/portfolio/config', { headers }).then((r) => r.ok ? r.json() : null),
    ]).then((results) => {
      if (cancelled) return
      setAnalytics(results[0].status === 'fulfilled' ? results[0].value : null)
      setContent(results[1].status === 'fulfilled' ? results[1].value : null)
      setMarket(results[2].status === 'fulfilled' ? results[2].value : null)
      setPortfolio(results[3].status === 'fulfilled' ? results[3].value : null)
    })
    return () => { cancelled = true }
  }, [token])

  const projectCount = (content?.projects || []).filter((p) => !p.hidden).length
  const transactionCount = (content?.transactions || []).length
  const holdingCount = (portfolio?.holdings || []).filter((h) => h.enabled !== false).length
  const marketReady = !!market?.hasApiKey

  const steps = [
    { n: 1, title: 'Update Your Profile', text: 'Upload your photo and update your personal information', done: !!content?.owner?.name, action: () => onNavigate('owner') },
    { n: 2, title: 'Add Your Content', text: 'Add projects, experience, education, and skills', done: projectCount > 0, action: () => onNavigate('projects') },
    { n: 3, title: 'Configure Investment Lab', text: 'Connect live market data and enter your portfolio holdings', done: marketReady && holdingCount > 0, action: () => onOpenTool('market') },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Eye} value={compactNumber(analytics?.range?.pageviews)} label="Total Page Views · 30d" foot={`${compactNumber(analytics?.allTime?.pageviews)} all-time`} tone="blue" />
        <StatCard icon={Users} value={compactNumber(analytics?.range?.uniqueVisitors)} label="Unique Visitors · 30d" foot="Session-based visitor count" tone="green" />
        <StatCard icon={Briefcase} value={compactNumber(analytics?.range?.projectViews)} label="Project Views · 30d" foot={`${projectCount} published projects`} tone="violet" />
        <StatCard icon={Download} value={compactNumber(analytics?.range?.resumeClicks)} label="Resume Clicks · 30d" foot={`${compactNumber(analytics?.allTime?.resumeClicks)} all-time`} tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_.95fr] gap-5">
        <section className="rounded-2xl bg-[#101b2d] text-white p-6 md:p-7 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-[20px] font-semibold tracking-tight">Getting Started</h2>
            <p className="mt-1 text-[12px] text-slate-400">Keep the portfolio current in three simple steps.</p>
            <div className="mt-6 space-y-5">
              {steps.map((step) => (
                <button key={step.n} onClick={step.action} className="w-full text-left group flex items-start gap-4">
                  <div className={cls('h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition', step.done ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white')}>
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[14px] font-medium text-white">{step.title}</div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                    </div>
                    <div className="mt-1 text-[11.5px] text-slate-400">{step.text}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => window.open('/', '_blank', 'noopener,noreferrer')} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[12px] font-medium text-white hover:bg-blue-500 transition">
              View Portfolio <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
          <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">Quick Actions</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {[
              { icon: User, title: 'Edit Hero Section', sub: 'Update your photo, headline and description', action: () => onNavigate('owner') },
              { icon: Briefcase, title: 'Add / Edit Projects', sub: 'Showcase your latest institutional-grade work', action: () => onNavigate('projects') },
              { icon: LineChart, title: 'Update Experience', sub: 'Add or edit your work experience', action: () => onNavigate('experience') },
              { icon: KeyRound, title: 'Configure Market API', sub: marketReady ? 'Market provider is connected' : 'Connect Twelve Data or Alpha Vantage', action: () => onOpenTool('market') },
              { icon: Wallet, title: 'Manage Live Portfolio', sub: `${holdingCount} active holding${holdingCount === 1 ? '' : 's'}`, action: () => onOpenTool('portfolio') },
            ].map((item) => (
              <button key={item.title} onClick={item.action} className="w-full py-3.5 flex items-center gap-3 text-left group">
                <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-blue-600" /></div>
                <div className="flex-1 min-w-0"><div className="text-[13px] font-medium text-slate-900">{item.title}</div><div className="mt-0.5 text-[10.5px] text-slate-400">{item.sub}</div></div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div><h2 className="text-[16px] font-semibold text-slate-950">Portfolio Status</h2><p className="mt-1 text-[10.5px] text-slate-400">Live configuration snapshot from your current CMS.</p></div>
          <button onClick={() => onNavigate('analytics')} className="text-[11px] text-blue-600 hover:text-blue-700">View analytics →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            ['Featured projects', `${projectCount}`, 'Public recruiter-facing case studies'],
            ['Transactions', `${transactionCount}`, 'Selected deal tombstones'],
            ['Market API', marketReady ? 'Connected' : 'Needs setup', market?.provider ? `Provider: ${market.provider}` : 'Configure a provider'],
            ['Live holdings', `${holdingCount}`, portfolio?.showPublic ? 'Public dashboard enabled' : 'Public dashboard hidden'],
          ].map(([label, value, sub]) => (
            <div key={label} className="p-5"><div className="text-[10px] uppercase tracking-[.15em] text-slate-400">{label}</div><div className="mt-2 text-[20px] font-semibold text-slate-900">{value}</div><div className="mt-1 text-[10.5px] text-slate-500">{sub}</div></div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SidebarButton({ active, icon: Icon, label, onClick, indent = false, suffix }) {
  return (
    <button onClick={onClick} className={cls(
      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] transition',
      indent && 'pl-8',
      active ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/30' : 'text-slate-300 hover:bg-white/[.06] hover:text-white'
    )}>
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {suffix}
    </button>
  )
}

export default function AdminDashboardLayout({ children }) {
  const legacyRef = useRef(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [view, setView] = useState('dashboard')
  const [labOpen, setLabOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const read = () => setAuthenticated(!!localStorage.getItem(TOKEN_KEY))
    read()
    const id = setInterval(read, 350)
    window.addEventListener('focus', read)
    return () => { clearInterval(id); window.removeEventListener('focus', read) }
  }, [])

  const token = useMemo(() => authenticated && typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) || '' : '', [authenticated])

  const hideFloatingTools = useCallback(() => {
    const buttons = [...document.querySelectorAll('button')]
    buttons.forEach((button) => {
      const text = (button.textContent || '').trim()
      if ((text === 'Market API' || text === 'Portfolio') && String(button.className).includes('fixed')) {
        button.style.opacity = '0'
        button.style.pointerEvents = 'none'
      }
    })
  }, [])

  const prepareLegacy = useCallback(() => {
    const host = legacyRef.current
    if (!host) return
    const root = host.firstElementChild
    const inner = root?.firstElementChild
    if (!root || !inner) return

    root.style.minHeight = 'auto'
    root.style.background = 'transparent'
    root.style.color = 'inherit'
    inner.style.maxWidth = 'none'
    inner.style.margin = '0'
    inner.style.padding = '0'

    const direct = [...inner.children]
    if (direct[0]) direct[0].style.display = 'none'
    if (direct[1]) direct[1].style.display = 'none'
    if (direct[2]) direct[2].style.marginTop = '0'

    const aside = host.querySelector('aside')
    if (aside) {
      aside.style.display = 'none'
      const grid = aside.parentElement
      if (grid) {
        grid.style.gridTemplateColumns = 'minmax(0, 1fr)'
        grid.style.gap = '0'
      }
    }

    hideFloatingTools()
  }, [hideFloatingTools])

  const clickLegacyButton = useCallback((label) => {
    const host = legacyRef.current
    if (!host) return false
    const button = [...host.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === label)
    if (!button) return false
    button.click()
    return true
  }, [])

  const syncLegacy = useCallback((nextView) => {
    if (nextView === 'dashboard') return
    const execute = () => {
      if (nextView === 'analytics') {
        clickLegacyButton('Analytics')
      } else if (nextView === 'files') {
        clickLegacyButton('Files')
      } else {
        clickLegacyButton('Content')
        const label = CONTENT_LABELS[nextView]
        if (label) setTimeout(() => clickLegacyButton(label), 15)
      }
      setTimeout(prepareLegacy, 30)
    }
    execute()
    ;[80, 180, 420].forEach((ms) => setTimeout(execute, ms))
  }, [clickLegacyButton, prepareLegacy])

  useEffect(() => {
    if (!authenticated) return
    syncLegacy(view)
    const timers = [0, 100, 300, 700].map((ms) => setTimeout(prepareLegacy, ms))
    return () => timers.forEach(clearTimeout)
  }, [authenticated, view, prepareLegacy, syncLegacy])

  useEffect(() => {
    if (!authenticated || !legacyRef.current) return
    const observer = new MutationObserver(() => prepareLegacy())
    observer.observe(legacyRef.current, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [authenticated, prepareLegacy])

  const navigate = (next) => {
    setView(next)
    setMobileOpen(false)
    if (next !== 'dashboard') setTimeout(() => syncLegacy(next), 0)
  }

  const openTool = (kind) => {
    setMobileOpen(false)
    const label = kind === 'market' ? 'Market API' : 'Portfolio'
    const attempt = () => {
      const button = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === label && String(b.className).includes('fixed'))
      if (button) { button.click(); return true }
      return false
    }
    if (!attempt()) setTimeout(attempt, 250)
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    window.location.reload()
  }

  if (!authenticated) return children

  const sidebar = (
    <div className="h-full flex flex-col bg-[#0d1727] text-white">
      <div className="px-5 pt-6 pb-5 border-b border-white/[.07]">
        <div className="text-[18px] font-semibold tracking-[.08em]">DEEPAK</div>
        <div className="mt-1 text-[10px] uppercase tracking-[.16em] text-slate-500">Admin Panel</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar space-y-1">
        <SidebarButton active={view === 'dashboard'} icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('dashboard')} />
        <SidebarButton active={view === 'owner'} icon={User} label="Hero Profile" onClick={() => navigate('owner')} />
        <SidebarButton active={view === 'chapters'} icon={BookOpen} label="About / Story" onClick={() => navigate('chapters')} />
        <SidebarButton active={view === 'projects'} icon={Briefcase} label="Featured Projects" onClick={() => navigate('projects')} />
        <SidebarButton active={view === 'transactions'} icon={Handshake} label="Transactions" onClick={() => navigate('transactions')} />

        <div>
          <SidebarButton
            active={false}
            icon={Activity}
            label="Investment Lab"
            onClick={() => setLabOpen((v) => !v)}
            suffix={<ChevronDown className={cls('h-3.5 w-3.5 transition', labOpen ? 'rotate-0' : '-rotate-90')} />}
          />
          {labOpen && (
            <div className="mt-1 space-y-1">
              <SidebarButton icon={KeyRound} label="Market API" indent onClick={() => openTool('market')} />
              <SidebarButton icon={Wallet} label="Portfolio" indent onClick={() => openTool('portfolio')} />
            </div>
          )}
        </div>

        <SidebarButton active={view === 'experience'} icon={LineChart} label="Experience" onClick={() => navigate('experience')} />
        <SidebarButton active={view === 'education'} icon={GraduationCap} label="Education" onClick={() => navigate('education')} />
        <SidebarButton active={view === 'certifications'} icon={BadgeCheck} label="Certifications" onClick={() => navigate('certifications')} />
        <SidebarButton active={view === 'testimonials'} icon={Quote} label="Testimonials" onClick={() => navigate('testimonials')} />
        <SidebarButton active={view === 'aspirations'} icon={Building2} label="Aspirational Firms" onClick={() => navigate('aspirations')} />
        <SidebarButton active={view === 'expertise'} icon={Tag} label="Expertise" onClick={() => navigate('expertise')} />
        <SidebarButton active={view === 'seo'} icon={Globe} label="SEO Settings" onClick={() => navigate('seo')} />
        <SidebarButton active={view === 'analytics'} icon={BarChart3} label="Analytics" onClick={() => navigate('analytics')} />
        <SidebarButton active={view === 'files'} icon={FolderOpen} label="Files & Storage" onClick={() => navigate('files')} />
        <SidebarButton active={view === 'danger'} icon={Settings} label="Settings" onClick={() => navigate('danger')} />
      </nav>

      <div className="p-4 border-t border-white/[.07]">
        <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400"><Database className="h-3.5 w-3.5 text-blue-400" /> Storage: Supabase</div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500"><ShieldAlert className="h-3.5 w-3.5" /> Server-side admin auth</div>
        </div>
      </div>
    </div>
  )

  const [title, subtitle] = PAGE_TITLES[view] || PAGE_TITLES.dashboard

  return (
    <div className="admin-dashboard-shell min-h-screen bg-[#f7f9fc] text-slate-900">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-[60] w-[260px] shadow-xl shadow-slate-950/5">{sidebar}</aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <aside className="h-full w-[280px] shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[260px] min-h-screen">
        <header className="h-[70px] bg-white/95 backdrop-blur border-b border-slate-200 flex items-center justify-between gap-4 px-5 md:px-8 sticky top-0 z-50">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"><Menu className="h-4 w-4" /></button>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[.14em] text-slate-400 hidden sm:block">Portfolio Administration</div>
              <div className="text-[13px] font-medium text-slate-800 truncate sm:hidden">{title}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-[12px] text-slate-500">Hi, <span className="font-medium text-blue-600">Deepak</span></div>
            <button onClick={() => window.open('/', '_blank', 'noopener,noreferrer')} className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" /> View Portfolio</button>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-100"><LogOut className="h-3.5 w-3.5" /> Logout</button>
          </div>
        </header>

        <main className="px-5 md:px-8 xl:px-10 py-7 md:py-8">
          <div className="max-w-[1450px] mx-auto">
            <div className="flex items-start justify-between gap-5 flex-wrap mb-7">
              <div><h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-1 text-[12.5px] text-slate-500">{subtitle}</p></div>
              {view !== 'dashboard' && <button onClick={() => navigate('dashboard')} className="text-[11px] text-blue-600 hover:text-blue-700">← Back to dashboard</button>}
            </div>

            {view === 'dashboard' && <DashboardHome token={token} onNavigate={navigate} onOpenTool={openTool} />}

            <div ref={legacyRef} className={cls('admin-legacy-editor', view === 'dashboard' && 'hidden')}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
