export const CERTIFICATE_META = [
  { id:'wharton-finance-quant', name:'Finance & Quantitative Modeling for Analysts', issuer:'Wharton Online · University of Pennsylvania · Coursera', year:2025, category:'Finance & Modeling', gained:'Spreadsheet modeling, quantitative analysis, forecasting and financial interpretation.', skills:['Financial Modeling','Forecasting','Quantitative Analysis'] },
  { id:'jobaaj-soft-skills', name:'Communication / Soft Skills', issuer:'Jobaaj Learnings', year:2025, category:'Professional Skills', gained:'Structured communication, stakeholder interaction and professional presentation.', skills:['Business Communication','Stakeholder Management','Presentation'] },
  { id:'jobaaj-advanced-modeling', name:'Advanced Modelling', issuer:'Jobaaj Learnings', year:2025, category:'Finance & Modeling', gained:'Model architecture, assumption building, scenario analysis and sensitivity work.', skills:['Financial Modeling','Scenario Analysis','Sensitivity Analysis'] },
  { id:'jobaaj-equity-research', name:'How to Build an Equity Research Report', issuer:'Jobaaj Learnings', year:2025, category:'Investment Research', gained:'Equity-research workflow from business analysis through valuation, risks and thesis.', skills:['Equity Research','Valuation','Investment Thesis'] },
  { id:'jobaaj-genai', name:'Artificial Intelligence & Generative AI', issuer:'Jobaaj Learnings', year:2025, category:'AI & Technology', gained:'Generative-AI concepts, prompt workflows and research/productivity augmentation.', skills:['Generative AI','Prompt Engineering','AI Workflows'] },
  { id:'jobaaj-excel-mastery', name:'Microsoft Excel Complete Mastery', issuer:'Jobaaj Learnings', year:2025, category:'Data & BI', gained:'Advanced spreadsheet productivity, formulas, data handling and model building.', skills:['Advanced Excel','Data Analysis','Spreadsheet Modeling'] },
  { id:'jobaaj-investment-banking', name:'Investment Banking Overview', issuer:'Jobaaj Learnings', year:2025, category:'Investment Banking', gained:'Transaction process, valuation, deal materials and execution fundamentals.', skills:['Investment Banking','M&A Process','Deal Execution'] },
  { id:'jobaaj-financial-modeling-valuation', name:'Financial Modelling & Valuations', issuer:'Jobaaj Learnings', year:2025, category:'Finance & Modeling', gained:'Connecting operating assumptions, financial statements and valuation outputs.', skills:['Financial Modeling','Valuation','DCF'] },
  { id:'oracle-otbi', name:'Oracle Fusion Smart View / Financial Reporting Studio / OTBI', issuer:'Udemy', year:2024, category:'Data & BI', gained:'Oracle Fusion financial reporting, Smart View and OTBI workflows.', skills:['Financial Reporting','BI Reporting','ERP Analytics'] },
  { id:'jpmorgan-commercial-banking', name:'Commercial Banking Job Simulation', issuer:'JPMorgan Chase & Co. · Forage', year:2024, category:'Banking & Credit', gained:'Financial statements, capitalization tables, deal structure and forecasting.', skills:['Financial Statement Analysis','Deal Structuring','Forecasting'] },
  { id:'linkedin-data-analyst', name:'Become a Data Analyst', issuer:'LinkedIn Learning', year:2024, category:'Data & BI', gained:'Data preparation, visualization and business reporting.', skills:['Data Analysis','Data Visualization','Business Intelligence'] },
  { id:'learnvern-excel', name:'MS Excel', issuer:'LearnVern', year:2024, category:'Data & BI', gained:'Spreadsheet analysis, formulas, reporting and data organization.', skills:['Excel','Spreadsheet Analysis','Reporting'] },
  { id:'cfi-corporate-finance', name:'CFI Corporate Finance Foundations Professional Certificate', issuer:'Corporate Finance Institute · LinkedIn Learning', year:2024, category:'Finance & Modeling', gained:'Corporate-finance fundamentals and financial statement analysis.', skills:['Corporate Finance','Financial Analysis','Capital Decisions'] },
  { id:'microsoft-project-management', name:'Career Essentials in Project Management', issuer:'Microsoft · LinkedIn Learning', year:2024, category:'Professional Skills', gained:'Project planning, prioritization, stakeholder coordination and execution.', skills:['Project Management','Planning','Execution'] },
  { id:'coursera-stock-valuation', name:'Stock Valuation with Comparable Companies Analysis', issuer:'Coursera Project Network', year:2024, category:'Investment Research', gained:'Peer selection, trading multiples and equity valuation using comparable companies.', skills:['Comparable Companies','Equity Valuation','Peer Benchmarking'] },
]

export const DEMO_INVESTMENT_LAB = {
  mode: 'manual',
  asOf: 'Latest manual snapshot',
  benchmark: 'NIFTY 50',
  metrics: {
    portfolioValue: 3872540,
    investedCapital: 3103000,
    absoluteReturn: 24.8,
    cagr: 18.6,
    dayPnL: 52340,
    dayPct: 1.37,
    benchmarkReturn: 16.9,
    alphaVsBenchmark: 7.9,
  },
  performance: [
    {date:'Jan 23', portfolio:100.0, benchmark:100.0},
    {date:'Mar 23', portfolio:103.2, benchmark:101.1},
    {date:'May 23', portfolio:108.6, benchmark:104.4},
    {date:'Jul 23', portfolio:111.4, benchmark:107.0},
    {date:'Sep 23', portfolio:106.8, benchmark:105.1},
    {date:'Nov 23', portfolio:112.9, benchmark:108.3},
    {date:'Jan 24', portfolio:118.4, benchmark:112.0},
    {date:'Mar 24', portfolio:122.1, benchmark:115.8},
    {date:'May 24', portfolio:128.7, benchmark:119.7},
    {date:'Jul 24', portfolio:134.2, benchmark:125.1},
    {date:'Sep 24', portfolio:131.8, benchmark:122.4},
    {date:'Nov 24', portfolio:141.6, benchmark:129.7},
    {date:'Jan 25', portfolio:124.8, benchmark:116.9},
  ],
  holdings: [
    {symbol:'HDFCBANK', name:'HDFC Bank', sector:'Financials', asset:'Equity', weight:9.8, cost:330000, value:412800, returnPct:25.1, dayPct:0.8, thesis:'High-quality banking franchise with durable deposit economics and improving return ratios.'},
    {symbol:'ICICIBANK', name:'ICICI Bank', sector:'Financials', asset:'Equity', weight:7.6, cost:225000, value:286650, returnPct:27.4, dayPct:1.2, thesis:'Strong underwriting, operating leverage and continued normalization of credit costs.'},
    {symbol:'LT', name:'Larsen & Toubro', sector:'Industrials', asset:'Equity', weight:6.8, cost:210000, value:263550, returnPct:25.5, dayPct:0.6, thesis:'Multi-year domestic capex cycle with execution depth and visible order book.'},
    {symbol:'MARUTI', name:'Maruti Suzuki', sector:'Consumer', asset:'Equity', weight:5.9, cost:180000, value:218880, returnPct:21.6, dayPct:-0.2, thesis:'Scale, distribution and premiumization support long-run cash generation.'},
    {symbol:'INFY', name:'Infosys', sector:'IT', asset:'Equity', weight:5.4, cost:165000, value:197010, returnPct:19.4, dayPct:0.4, thesis:'High cash conversion and resilient global delivery model with AI-led reinvestment optionality.'},
    {symbol:'RELIANCE', name:'Reliance Industries', sector:'Energy / Consumer', asset:'Equity', weight:8.2, cost:260000, value:301600, returnPct:16.0, dayPct:1.0, thesis:'Multiple compounding engines across energy, retail and digital infrastructure.'},
    {symbol:'GSEC', name:'Government Securities', sector:'Sovereign', asset:'Debt', weight:10.6, cost:350000, value:360000, returnPct:2.9, dayPct:0.1, thesis:'Portfolio ballast and liquidity reserve.'},
    {symbol:'GOLD', name:'Gold ETF', sector:'Gold', asset:'Gold', weight:4.8, cost:142000, value:158500, returnPct:11.6, dayPct:-0.1, thesis:'Diversifier against macro and currency shocks.'},
    {symbol:'CASH', name:'Cash / Liquid Fund', sector:'Cash', asset:'Cash', weight:2.2, cost:85000, value:85000, returnPct:0, dayPct:0, thesis:'Dry powder for dislocations and new ideas.'},
  ],
  research: [
    {id:'r1', title:'HDFC Bank — A Compounding Franchise Through the Reset', date:'14 Jan 2025', type:'Company Research', status:'Hold / Add on weakness', tags:['Quality','Banking','Compounding'], summary:'A high-quality franchise with durable returns, improving liability mix and a long runway for growth. The key debate is the pace of post-merger balance-sheet normalization.', thesis:'Own the franchise through the transition; add when market expectations compress faster than underlying economics.'},
    {id:'r2', title:'India Capex Cycle — Who Actually Captures the Economics?', date:'03 Dec 2024', type:'Theme', status:'Monitoring', tags:['Industrials','Capex','Infrastructure'], summary:'A framework for separating headline order-book beneficiaries from companies with real pricing power, cash conversion and balance-sheet capacity.', thesis:'Prefer operators where order growth converts to free cash flow without working-capital blowouts.'},
    {id:'r3', title:'IT Services: AI Is a Mix Shift Before It Is a Revenue Shock', date:'21 Nov 2024', type:'Sector Note', status:'Active', tags:['IT','AI','Services'], summary:'The near-term impact of AI is more likely to show up in project mix, productivity and pricing than a sudden collapse in enterprise IT spend.', thesis:'Track realized pricing and employee productivity rather than only GenAI deal announcements.'},
  ],
  journal: [
    {id:'j1', date:'22 Jan 2025', action:'ADD', holding:'HDFC Bank', note:'Added after a broad market correction. Thesis unchanged; valuation improved while deposit growth remains the key monitorable.'},
    {id:'j2', date:'08 Jan 2025', action:'TRIM', holding:'Larsen & Toubro', note:'Reduced position after a sharp rerating. Business quality remains intact, but expected return narrowed versus alternatives.'},
    {id:'j3', date:'19 Dec 2024', action:'PASS', holding:'High-growth consumer name', note:'Passed despite strong revenue growth because working-capital intensity and valuation left insufficient downside protection.'},
    {id:'j4', date:'04 Dec 2024', action:'REVIEW', holding:'Infosys', note:'Reviewed AI commentary and deal pipeline. No thesis change; monitor whether productivity benefits accrue to vendor or client.'},
  ],
  risk: {
    volatility:14.2,
    sharpe:1.26,
    sortino:1.61,
    maxDrawdown:-13.8,
    beta:0.92,
    alpha:5.9,
    var95:-2.1,
    expectedShortfall:-3.2,
  },
  attribution: [
    {name:'Financials', contribution:7.2},
    {name:'Industrials', contribution:4.1},
    {name:'Consumer', contribution:3.3},
    {name:'IT', contribution:2.9},
    {name:'Energy', contribution:2.1},
    {name:'Gold / Debt', contribution:1.4},
  ],
}

export function inr(value, compact=false) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (compact) {
    if (Math.abs(n) >= 1e7) return `₹${(n/1e7).toFixed(2)} Cr`
    if (Math.abs(n) >= 1e5) return `₹${(n/1e5).toFixed(2)} L`
  }
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)
}
