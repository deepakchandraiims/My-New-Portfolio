export const RECRUITER_PROJECT_CATEGORIES = [
  'All',
  'Private Equity',
  'Investment Banking / M&A',
  'Special Situations / Distressed',
  'Hedge Fund',
  'Private Credit',
  'Growth Equity',
]

const accents = {
  'Private Equity': 'from-blue-500/25 to-indigo-500/15',
  'Investment Banking / M&A': 'from-sky-500/25 to-blue-500/15',
  'Special Situations / Distressed': 'from-slate-500/25 to-zinc-500/15',
  'Hedge Fund': 'from-cyan-500/25 to-blue-500/15',
  'Private Credit': 'from-indigo-500/25 to-slate-500/15',
  'Growth Equity': 'from-violet-500/25 to-blue-500/15',
}

const icons = {
  'Private Equity': 'PE',
  'Investment Banking / M&A': 'M&A',
  'Special Situations / Distressed': 'SS',
  'Hedge Fund': 'HF',
  'Private Credit': 'PC',
  'Growth Equity': 'GE',
}

const raw = [
  ['pe-full-lbo','Full LBO Acquisition Case','Private Equity','Mid-Market Buyout','Purchase price, sources & uses, debt schedule, operating case, exit assumptions, MOIC/IRR, downside/base/upside and covenant stress cases.','IC memo + full LBO model + 100-day plan',['LBO','Sources & Uses','Debt Schedule','MOIC','IRR','Covenants'],['Excel','PowerPoint','Capital IQ']],
  ['pe-buy-build','Buy-and-Build Platform Strategy','Private Equity','Fragmented Industry Consolidation','Select a platform and 5–10 bolt-ons; model acquisition multiples, synergies, integration costs, leverage and exit value.','Platform thesis + bolt-on map + consolidated LBO',['Buy-and-Build','Bolt-ons','Synergies','Leverage','Integration'],['Excel','PowerPoint','PitchBook','Capital IQ']],
  ['pe-value-creation','Operational Value Creation Model','Private Equity','Portfolio Operations','Diagnose pricing, procurement, SG&A, working capital, sales productivity and capex, then bridge entry EBITDA to exit EBITDA.','Value-creation bridge + operating model',['Pricing','Procurement','SG&A','Working Capital','EBITDA Bridge'],['Excel','Power BI','PowerPoint']],
  ['pe-public-private','Public-to-Private Transaction','Private Equity','Take-Private','Analyze take-private feasibility including premium, financing, shareholder structure, delisting process and exit.','Take-private model + transaction memo',['Take-Private','Premium','Financing','Delisting','Exit'],['Excel','Capital IQ','PowerPoint']],
  ['pe-kill-invest','PE Investment Committee — Kill or Invest','Private Equity','Investment Committee','Build the thesis and bear case for a controversial company, including red flags, management assessment, DD questions and downside recovery.','IC recommendation + red-team appendix',['Investment Thesis','Bear Case','Due Diligence','Management','Downside'],['Excel','PowerPoint','Capital IQ']],

  ['ib-sell-side','Live-Style Sell-Side M&A Process','Investment Banking / M&A','Sell-Side Advisory','Create teaser, CIM, buyer universe, valuation, transaction timeline, management presentation and simulated Round 1 / Round 2 bid comparison.','Teaser + CIM + buyer list + bid comparison',['Sell-Side','CIM','Buyer Universe','Valuation','Bid Process'],['Excel','PowerPoint','Capital IQ','PitchBook']],
  ['ib-cross-border','Cross-Border Acquisition Model','Investment Banking / M&A','Cross-Border M&A','Model buyer and target across countries with FX, tax, purchase accounting, financing, synergies, accretion/dilution and regulatory issues.','Cross-border merger model + advisory memo',['FX','Tax','Purchase Accounting','Synergies','Accretion/Dilution'],['Excel','PowerPoint','Capital IQ']],
  ['ib-merger-model','Merger Model with Accretion / Dilution','Investment Banking / M&A','Public Company M&A','Model purchase consideration, stock/cash mix, synergies, financing, EPS accretion/dilution, ownership and pro forma financials.','Merger model + exchange-ratio sensitivity',['Merger Model','EPS','Exchange Ratio','Pro Forma','Synergies'],['Excel','Capital IQ','PowerPoint']],
  ['ib-strategic-alts','Strategic Alternatives / Board Advisory','Investment Banking / M&A','Board Advisory','Compare remain independent, sell, acquire, spin-off, IPO subsidiary and leveraged recap alternatives, then recommend one.','Strategic alternatives board deck',['Strategic Alternatives','Spin-off','IPO','Recap','Valuation'],['Excel','PowerPoint','Capital IQ']],
  ['ib-carveout','Complex Carve-Out Transaction','Investment Banking / M&A','Carve-Out','Build standalone financials from parent disclosures, normalize allocations, estimate stranded costs, TSA arrangements, buyer synergies and valuation.','Carve-out model + standalone financials + TSA bridge',['Carve-Out','Standalone Financials','Stranded Costs','TSA','Synergies'],['Excel','PowerPoint','Capital IQ']],

  ['ss-restructuring','Distressed Company Restructuring','Special Situations / Distressed','Restructuring','Build a 13-week cash flow, debt maturity and covenant model, liquidity runway, restructuring options and security-by-security recovery waterfall.','13-week cash flow + restructuring model + waterfall',['13-Week Cash Flow','Liquidity','Covenants','Restructuring','Recovery'],['Excel','PowerPoint','Capital IQ']],
  ['ss-debt-equity','Debt-for-Equity Swap Case','Special Situations / Distressed','Liability Management','Compare liquidation versus restructuring recoveries, convert debt into equity and model the new capital structure and ownership.','Debt-for-equity model + post-reorg cap table',['Debt-for-Equity','Recovery','Cap Table','Reorganization','Valuation'],['Excel','PowerPoint']],
  ['ss-bankruptcy','Bankruptcy / Insolvency Recovery Model','Special Situations / Distressed','Insolvency','Allocate enterprise value across secured, unsecured, subordinated, preferred and common securities under multiple scenarios.','Recovery waterfall + implied security values',['Waterfall','Secured Debt','Unsecured Debt','Recovery Rate','Liquidation'],['Excel','Capital IQ']],
  ['ss-rescue','Stressed Acquisition / Rescue Financing','Special Situations / Distressed','Rescue Capital','Structure rescue debt, warrants, preferred equity or convertibles and model investor returns plus downside protection.','Rescue financing term sheet + returns model',['Rescue Financing','Warrants','Preferred Equity','Convertibles','Downside'],['Excel','PowerPoint']],
  ['ss-cap-arb','Capital Structure Arbitrage Case','Special Situations / Distressed','Capital Structure','Identify inconsistent pricing between equity, bonds or CDS, infer market probabilities and construct a cross-security thesis.','Capital-structure arb memo + scenario model',['Bonds','Equity','CDS','Implied Probability','Relative Value'],['Excel','Bloomberg','Capital IQ']],

  ['hf-pair-trade','Long / Short Equity Pair Trade','Hedge Fund','Fundamental Long/Short','Select two competitors, long the stronger and short the weaker, with operating models, valuation, catalysts, risks and sector-neutral expected return.','Pair-trade investment memo + model',['Long/Short','Catalysts','Valuation','Risk','Pair Trade'],['Excel','Bloomberg','Capital IQ']],
  ['hf-merger-arb','Event-Driven Merger Arbitrage','Hedge Fund','Event-Driven','Analyze deal spread, annualized return, probability of close, break price, regulatory risk and financing conditions.','Probability-weighted merger-arb model',['Merger Arbitrage','Deal Spread','Probability','Break Price','Regulatory'],['Excel','Bloomberg','Capital IQ']],
  ['hf-variant','Variant Perception Equity Research','Hedge Fund','Fundamental Equity','Identify where consensus is wrong, compare estimates with Street expectations, build KPI drivers and show catalyst timing.','Variant-perception memo + KPI model',['Variant Perception','Consensus','Earnings Surprise','KPIs','Catalysts'],['Excel','Bloomberg','Capital IQ']],
  ['hf-activist','Activist Investment Thesis','Hedge Fund','Activist','Model value unlock from spin-off, buyback, asset sale, board changes, cost cuts or leverage and estimate resulting share price.','Activist deck + sum-of-parts / value-unlock model',['Activism','Spin-off','Buyback','Asset Sale','SOTP'],['Excel','PowerPoint','Capital IQ']],
  ['hf-short','Short-Seller Forensic Accounting Case','Hedge Fund','Forensic Research','Analyze working capital, receivables, cash conversion, related parties, capitalization policies, acquisitions and management disclosures.','Forensic red-flag dashboard + short thesis',['Forensic Accounting','Receivables','Cash Conversion','Related Parties','Short Thesis'],['Excel','Power BI','Capital IQ']],

  ['pc-direct-lending','Direct Lending Underwriting Memo','Private Credit','Sponsor-Backed Lending','Determine maximum debt capacity and underwrite leverage, coverage, FCF, liquidity, pricing, amortization, maturity and covenants.','Credit memo + debt sizing model',['Direct Lending','Leverage','Interest Coverage','FCF','Covenants'],['Excel','PowerPoint','Capital IQ']],
  ['pc-unitranche','Unitranche Financing Case','Private Credit','Acquisition Finance','Compare senior + mezzanine, unitranche, bank term loan and bond financing, including lender IRRs and borrower cost.','Debt package comparison + lender returns model',['Unitranche','Mezzanine','Term Loan','Lender IRR','Cost of Debt'],['Excel','PowerPoint']],
  ['pc-recovery','Downside Recovery Analysis','Private Credit','Credit Downside','Stress EBITDA by 20%, 30% and 40%, estimate liquidation / enterprise value and calculate recovery by tranche.','Downside recovery waterfall',['Recovery','EBITDA Stress','Liquidation Value','Debt Tranches','Downside'],['Excel','Capital IQ']],
  ['pc-covenant','Covenant Stress-Test Engine','Private Credit','Covenant Analytics','Build a dynamic engine for leverage, FCCR, DSCR, liquidity and interest coverage and identify breach points across scenarios.','Dynamic covenant dashboard',['Covenants','FCCR','DSCR','Liquidity','Interest Coverage'],['Excel','Python','Power BI']],
  ['pc-sponsor-committee','Sponsor Financing Committee Case','Private Credit','Sponsor Finance','Act as lender on a sponsor acquisition and evaluate sponsor quality, business quality, leverage, equity cushion, downside protection, documentation and pricing.','Financing committee approve / reject memo',['Sponsor Quality','Equity Cushion','Documentation','Pricing','Downside Protection'],['Excel','PowerPoint','Capital IQ']],

  ['ge-saas','SaaS Growth Investment Case','Growth Equity','SaaS','Build ARR, NRR, churn, CAC, LTV, CAC payback, cohort analysis, gross margin, Rule of 40, valuation, dilution and exit.','Growth investment memo + SaaS operating model',['ARR','NRR','CAC','LTV','Rule of 40'],['Excel','Python','PowerPoint']],
  ['ge-minority','Minority Investment Model','Growth Equity','Minority Growth','Model a 20–30% investment with primary versus secondary shares, founder dilution, ESOP expansion, governance rights, liquidation preference and exit proceeds.','Minority investment model + cap table',['Minority Investment','Primary','Secondary','Dilution','Liquidation Preference'],['Excel','PowerPoint']],
  ['ge-profitability','Growth-to-Profitability Bridge','Growth Equity','Scaling Business','Model a loss-making growth company from negative EBITDA to profitability using sales efficiency, contribution margin, operating leverage and cash burn.','Growth-to-profitability operating bridge',['Contribution Margin','Sales Efficiency','Operating Leverage','Cash Burn','EBITDA'],['Excel','Power BI']],
  ['ge-portfolio','Growth Equity Portfolio Construction','Growth Equity','Portfolio Strategy','Analyze 10 late-stage companies, rank growth, unit economics, TAM, retention, margins and valuation, then construct a hypothetical ₹1,000 crore portfolio.','Portfolio construction model + ranking framework',['Portfolio Construction','TAM','Unit Economics','Retention','Concentration Risk'],['Excel','Python','Power BI']],
  ['ge-preipo','Pre-IPO Growth Investment','Growth Equity','Pre-IPO','Analyze a company 2–3 years before IPO; model IPO valuation, dilution, secondary sell-down, lock-up, IRR and strategic-sale alternative.','Pre-IPO investment memo + exit model',['Pre-IPO','IPO Valuation','Dilution','Secondary','IRR'],['Excel','PowerPoint','Capital IQ']],
]

export const RECRUITER_PROJECTS = raw.map(([id,title,category,industry,summary,deliverable,tags,tools], index) => ({
  id,
  title,
  category,
  industry,
  year: 2026,
  accent: accents[category],
  coverEmoji: icons[category],
  tags,
  tools,
  impact: deliverable,
  metrics: [
    { k: 'Track', v: category.replace('Investment Banking / M&A','IB / M&A').replace('Special Situations / Distressed','Distressed') },
    { k: 'Status', v: 'Portfolio Build' },
    { k: 'Level', v: 'Institutional' },
  ],
  featured: index % 5 === 0,
  executiveSummary: summary,
  problem: `Build an institutional-grade ${title.toLowerCase()} that demonstrates decision-quality analysis rather than a classroom exercise.`,
  approach: [
    summary,
    'Use real-company disclosures and clearly sourced assumptions wherever possible.',
    'Build base, downside and upside cases with explicit sensitivities and decision thresholds.',
    'Conclude with a concise investment / advisory recommendation and the key risks that could invalidate it.',
  ],
  deliverables: deliverable.split(' + '),
  learnings: `Designed to demonstrate ${tags.slice(0,3).join(', ')} and the ability to turn analysis into an investment or advisory decision.`,
  readingMinutes: 6,
}))
