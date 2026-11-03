export const FINANCE_ROOMS = [
  {
    slug: 'investment-banking',
    label: 'Investment Banking',
    short: 'IB',
    description: 'M&A, valuation and transaction casework: from target screening and modelling to strategic alternatives and execution-style materials.',
    tagline: 'From target screen to board decision',
    color: '#22304a',
    darkColor: '#1c2840',
    match: /investment banking|m&a|merger|sell-side|buy-side|carve|cross-border|strategic alternatives|valuation/i,
    bullets: ['M&A and strategic alternatives', 'Three-statement and transaction modelling', 'Valuation and accretion / dilution', 'Board and investment materials', 'Cross-border transaction analysis'],
  },
  {
    slug: 'private-equity',
    label: 'Private Equity',
    short: 'PE',
    description: 'Buyout underwriting and investment-committee casework built around cash generation, leverage, downside protection and value creation.',
    tagline: 'From entry assumptions to exit returns',
    color: '#4a3540',
    darkColor: '#3f2d37',
    match: /private equity|lbo|buyout|take-private|value creation|investment committee|buy-and-build/i,
    bullets: ['LBO underwriting', 'Sources & uses and debt schedules', 'Returns attribution', 'Value-creation planning', 'Investment committee cases'],
  },
  {
    slug: 'special-situations',
    label: 'Special Situations',
    short: 'SS',
    description: 'Special-situations casework where timing, liquidity, downside recovery and bespoke structuring matter more than headline growth.',
    tagline: 'Complex capital. Structured downside.',
    color: '#7a8670',
    darkColor: '#66705d',
    match: /special situations|distressed|restruct|rescue|bankrupt|debt-for-equity|capital structure|arbitrage/i,
    bullets: ['Restructuring and rescue capital', 'Downside and recovery analysis', 'Debt-for-equity scenarios', 'Event-driven underwriting', 'Capital-structure solutions'],
  },
  {
    slug: 'private-credit',
    label: 'Private Credit',
    short: 'PC',
    description: 'Private-credit casework across direct lending, unitranche, sponsor financing and covenant-intensive downside analysis.',
    tagline: 'Underwrite the cash, not the story',
    color: '#a4552c',
    darkColor: '#8c4826',
    match: /private credit|direct lending|unitranche|covenant|recovery|sponsor financing|credit/i,
    bullets: ['Direct-lending underwriting', 'Unitranche and sponsor financing', 'Covenant stress testing', 'Debt capacity and coverage', 'Recovery and downside cases'],
  },
  {
    slug: 'investment-research',
    label: 'Investment Research',
    short: 'IR',
    description: 'Public-markets and growth-investing work built around variant perception, catalysts, operating drivers and evidence.',
    tagline: 'Variant perception, backed by evidence',
    color: '#262523',
    darkColor: '#201f1d',
    match: /hedge fund|long \/ short|activist|short-seller|pair trade|merger arbitrage|variant|growth equity|saas|pre-ipo|minority|research/i,
    bullets: ['Variant-perception research', 'Event-driven cases', 'Growth-equity underwriting', 'Forensic and short theses', 'Catalyst and scenario analysis'],
  },
]

export function roomForProject(project = {}) {
  const hay = [
    project.category,
    project.title,
    project.subtitle,
    project.industry,
    ...(project.tags || []),
  ].filter(Boolean).join(' ')
  return FINANCE_ROOMS.find((room) => room.match.test(hay)) || FINANCE_ROOMS[0]
}

export function cleanOwner(raw = {}) {
  const looksSeeded =
    /portfolio\.dev/i.test(String(raw.email || '')) ||
    /seven years across/i.test(String(raw.bio || '')) ||
    /mumbai.*singapore/i.test(String(raw.location || ''))

  if (looksSeeded) {
    return {
      ...raw,
      name: 'Deepak Chandra',
      role: 'Strategic Finance · M&A · Private Markets',
      currentRole: 'Assistant Manager · Strategic Finance',
      location: 'Delhi NCR, India',
      email: '',
      linkedin: raw.linkedin && !/example/i.test(raw.linkedin) ? raw.linkedin : '',
      tagline: 'I work at the intersection of M&A, strategic finance and private markets — building the analysis behind capital allocation and transaction decisions.',
      bio: 'Finance professional focused on M&A, strategic initiatives, financial modelling and investment research.',
    }
  }
  return {
    name: 'Deepak Chandra',
    role: 'Strategic Finance · M&A · Private Markets',
    currentRole: 'Strategic Finance · M&A',
    location: 'Delhi NCR, India',
    tagline: 'I work at the intersection of M&A, strategic finance and private markets — building the analysis behind capital allocation and transaction decisions.',
    ...raw,
  }
}

export function cleanStory(content = {}) {
  const exp = Array.isArray(content.experience) ? content.experience : []
  const edu = Array.isArray(content.education) ? content.education : []
  const seeded = exp.some((x) => /Meridian Corporate Advisory|Northgate Consulting|Fortis Capital/i.test(String(x.company || ''))) ||
    edu.some((x) => /Indian School of Business|Shri Ram College/i.test(String(x.institution || '')))

  if (!seeded && (exp.length || edu.length)) {
    return [
      ...exp.map((x) => ({
        id: x.id,
        title: x.role,
        org: x.company,
        period: x.period,
        location: x.location,
        bullets: x.bullets || [],
      })),
      ...edu.map((x) => ({
        id: x.id,
        title: x.degree,
        org: x.institution,
        period: x.period,
        location: x.location,
        bullets: x.details ? [x.details] : [],
      })),
    ]
  }

  return [
    {
      id: 'current',
      title: 'Assistant Manager · Strategic Finance',
      org: 'Infollion Research Services Ltd',
      period: '2026 — Now',
      location: 'Gurugram',
      bullets: [
        'Own M&A target identification, screening and transaction analysis across strategic acquisition themes.',
        'Build financial models, valuation work and investment materials for management decision-making.',
      ],
    },
    {
      id: 'mba',
      title: 'MBA · Strategy & Finance',
      org: 'IIM Sambalpur',
      period: '2023 — 2025',
      location: 'India',
      bullets: ['Focused on strategy, finance and transaction-oriented decision-making.'],
    },
    {
      id: 'bcom',
      title: 'B.Com (Hons.)',
      org: 'University of Delhi',
      period: 'Before 2023',
      location: 'Delhi',
      bullets: ['Built the accounting and corporate-finance foundation that now underpins transaction work.'],
    },
  ]
}

export function yearFromPeriod(period = '') {
  const years = String(period).match(/20\d{2}/g) || []
  return years[0] || years[years.length - 1] || String(new Date().getFullYear())
}
