'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity, ArrowLeft, BookOpen, Gauge, LineChart as LineChartIcon, RefreshCw,
  Search, ShieldCheck,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { DEMO_INVESTMENT_LAB, inr } from '@/lib/portfolio-showcase-data'
import s from './InvestmentLabClient.module.css'

const TABS = ['Overview','Portfolio','Research','Journal','Analytics']
const RANGES = ['1M','3M','6M','1Y','3Y','Since Inception']
const COLORS = ['#244d86','#6d8fb7','#a6bacd','#d6c5a5','#75866d','#8c5a40','#5a6774']

function pct(v, digits=1) {
  const n=Number(v)
  if(!Number.isFinite(n)) return '—'
  return `${n>=0?'+':''}${n.toFixed(digits)}%`
}
function num(v,d=2){const n=Number(v);return Number.isFinite(n)?n.toFixed(d):'—'}
function tone(v){return Number(v)>=0?s.good:s.bad}

function Donut({data, centerTop, centerBottom}) {
  return <div className={s.donutWrap}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="57%" outerRadius="82%" paddingAngle={1.5} stroke="none">
          {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
        </Pie>
        <Tooltip formatter={(v)=>`${num(v,1)}%`} contentStyle={{fontSize:11,borderRadius:10,border:'1px solid rgba(26,24,24,.12)'}}/>
      </PieChart>
    </ResponsiveContainer>
    <div className={s.donutCenter}><strong>{centerTop}</strong><span>{centerBottom}</span></div>
  </div>
}

function Stat({label,value,sub,positive}) {
  return <div className={s.stat}>
    <span>{label}</span><strong className={positive===undefined?'':positive?s.good:s.bad}>{value}</strong>
    {sub&&<small>{sub}</small>}
  </div>
}

function buildLiveDemo(live) {
  if(!live || !Array.isArray(live.holdings) || !live.holdings.length) return null
  const base=DEMO_INVESTMENT_LAB
  const totals=live.totals||{}
  const holdings=live.holdings.filter(h=>h?.enabled!==false).map((h,i)=>({
    symbol:h.symbol||`H${i+1}`,
    name:h.label||h.symbol||`Holding ${i+1}`,
    sector:h.sector||'Unclassified',
    asset:h.assetClass||'Equity',
    weight:Number(h.weight)||0,
    cost:Number(h.costValue ?? h.investedValue ?? 0),
    value:Number(h.currentValue ?? 0),
    returnPct:Number(h.returnPct ?? h.pnlPct ?? 0),
    dayPct:Number(h.percentChange ?? h.dayPct ?? 0),
    thesis:h.thesis||'Thesis will appear here when added from Admin.',
  }))
  const current=Number(totals.currentValue)
  const invested=Number(totals.investedCapital ?? totals.costValue)
  const absolute=Number(totals.absoluteReturnPct ?? totals.returnPct)
  return {
    ...base,
    mode:'live',
    asOf:live.fetchedAt||'Latest available',
    metrics:{
      ...base.metrics,
      portfolioValue:Number.isFinite(current)?current:base.metrics.portfolioValue,
      investedCapital:Number.isFinite(invested)?invested:base.metrics.investedCapital,
      absoluteReturn:Number.isFinite(absolute)?absolute:base.metrics.absoluteReturn,
      dayPnL:Number.isFinite(Number(totals.dayPnL))?Number(totals.dayPnL):base.metrics.dayPnL,
      dayPct:Number.isFinite(Number(totals.dayPct))?Number(totals.dayPct):base.metrics.dayPct,
    },
    holdings:holdings.length?holdings:base.holdings,
  }
}

export default function InvestmentLabClient() {
  const [tab,setTab]=useState('Overview')
  const [range,setRange]=useState('Since Inception')
  const [lab,setLab]=useState(DEMO_INVESTMENT_LAB)
  const [liveState,setLiveState]=useState('checking')
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState(DEMO_INVESTMENT_LAB.holdings[0]?.symbol||'')
  const [researchFilter,setResearchFilter]=useState('All')

  useEffect(()=>{
    let active=true
    Promise.allSettled([
      fetch('/api/portfolio/live',{cache:'no-store'}).then(async r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`))),
      fetch('/api/content',{cache:'no-store'}).then(r=>r.ok?r.json():null),
    ]).then(([liveResult,contentResult])=>{
      if(!active)return
      const live=liveResult.status==='fulfilled'?buildLiveDemo(liveResult.value):null
      const content=contentResult.status==='fulfilled'?contentResult.value:null
      const manual=content?.investmentLab||{}
      const merged=live||DEMO_INVESTMENT_LAB
      setLab({
        ...merged,
        research:Array.isArray(manual.research)&&manual.research.length?manual.research:merged.research,
        journal:Array.isArray(manual.journal)&&manual.journal.length?manual.journal:merged.journal,
      })
      setLiveState(live?'live':'manual')
      setSelected((live?.holdings||merged.holdings)?.[0]?.symbol||'')
    })
    return()=>{active=false}
  },[])

  const holdings=lab.holdings||[]
  const selectedHolding=holdings.find(h=>h.symbol===selected)||holdings[0]

  const assetData=useMemo(()=>{
    const map={}
    holdings.forEach(h=>{map[h.asset||'Other']=(map[h.asset||'Other']||0)+(Number(h.weight)||0)})
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
  },[holdings])
  const sectorData=useMemo(()=>{
    const map={}
    holdings.forEach(h=>{map[h.sector||'Other']=(map[h.sector||'Other']||0)+(Number(h.weight)||0)})
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
  },[holdings])
  const filteredHoldings=useMemo(()=>{
    const q=query.trim().toLowerCase()
    return !q?holdings:holdings.filter(h=>[h.name,h.symbol,h.sector,h.asset].join(' ').toLowerCase().includes(q))
  },[holdings,query])
  const researchTypes=['All',...new Set((lab.research||[]).map(r=>r.type))]
  const visibleResearch=(lab.research||[]).filter(r=>researchFilter==='All'||r.type===researchFilter)

  const perf=lab.performance||[]
  const visiblePerf=range==='Since Inception'?perf:
    range==='1M'?perf.slice(-2):
    range==='3M'?perf.slice(-3):
    range==='6M'?perf.slice(-5):
    range==='1Y'?perf.slice(-7):
    range==='3Y'?perf.slice(-11):perf

  return <div className={s.root}>
    <header className={s.topbar}>
      <Link href="/" className={s.back}><ArrowLeft size={15}/> Portfolio</Link>
      <div className={s.brand}>DC / INVESTMENT LAB</div>
      <div className={s.mode}>
        <i className={liveState==='live'?s.dotLive:s.dotManual}/>
        <span>{liveState==='checking'?'Checking market connection…':liveState==='live'?'Live market data':'Manual / educational mode'}</span>
      </div>
    </header>

    <main className={s.shell}>
      <section className={s.hero}>
        <div>
          <p className={s.kicker}>Investing / Research / Learning</p>
          <h1>Investment Lab</h1>
          <p className={s.subtitle}>A transparent record of investment thinking, portfolio construction and post-investment analysis.</p>
        </div>
        <div className={s.education}><BookOpen size={19}/><div><strong>A living educational portfolio</strong><span>Invest · Research · Reflect · Learn</span></div></div>
      </section>

      <nav className={s.tabs}>
        {TABS.map(x=><button key={x} className={tab===x?s.tabActive:''} onClick={()=>setTab(x)}>{x}</button>)}
      </nav>

      {tab==='Overview'&&<>
        <section className={s.stats}>
          <Stat label="Portfolio value" value={inr(lab.metrics.portfolioValue,true)} sub={`${pct(lab.metrics.absoluteReturn)} vs cost`} positive={lab.metrics.absoluteReturn>=0}/>
          <Stat label="Invested capital" value={inr(lab.metrics.investedCapital,true)} />
          <Stat label="Absolute return" value={pct(lab.metrics.absoluteReturn)} positive={lab.metrics.absoluteReturn>=0}/>
          <Stat label="CAGR / XIRR" value={pct(lab.metrics.cagr)} positive={lab.metrics.cagr>=0}/>
          <Stat label="Day P&L" value={`${inr(lab.metrics.dayPnL,true)} (${pct(lab.metrics.dayPct)})`} positive={lab.metrics.dayPnL>=0}/>
          <Stat label={`vs ${lab.benchmark}`} value={`${pct(lab.metrics.alphaVsBenchmark)} pp`} sub={`${num(lab.metrics.absoluteReturn,1)}% vs ${num(lab.metrics.benchmarkReturn,1)}%`} positive={lab.metrics.alphaVsBenchmark>=0}/>
        </section>

        <section className={s.overviewGrid}>
          <div className={s.chartCard}>
            <div className={s.cardHead}><div><span>Performance</span><h2>Portfolio vs Benchmark</h2></div><div className={s.range}>{RANGES.map(r=><button key={r} onClick={()=>setRange(r)} className={range===r?s.rangeOn:''}>{r}</button>)}</div></div>
            <div className={s.lineChart}><ResponsiveContainer width="100%" height="100%"><LineChart data={visiblePerf}><CartesianGrid vertical={false} stroke="rgba(26,24,24,.08)"/><XAxis dataKey="date" tick={{fontSize:10,fill:'#7f7772'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:'#7f7772'}} axisLine={false} tickLine={false} domain={['auto','auto']}/><Tooltip contentStyle={{fontSize:11,borderRadius:10,border:'1px solid rgba(26,24,24,.12)'}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="portfolio" name="My Portfolio" stroke="#244d86" strokeWidth={2.4} dot={false}/><Line type="monotone" dataKey="benchmark" name={lab.benchmark} stroke="#b0a393" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
          </div>
          <div className={s.allocCard}><div className={s.cardHead}><div><span>Exposure</span><h2>Asset Allocation</h2></div></div><Donut data={assetData} centerTop={inr(lab.metrics.portfolioValue,true)} centerBottom="Total"/><div className={s.legend}>{assetData.map((x,i)=><div key={x.name}><i style={{background:COLORS[i%COLORS.length]}}/><span>{x.name}</span><b>{num(x.value,1)}%</b></div>)}</div></div>
          <div className={s.allocCard}><div className={s.cardHead}><div><span>Equity</span><h2>Sector Allocation</h2></div></div><Donut data={sectorData} centerTop={`${num(sectorData.reduce((a,b)=>a+b.value,0),0)}%`} centerBottom="Mapped"/><div className={s.legend}>{sectorData.slice(0,6).map((x,i)=><div key={x.name}><i style={{background:COLORS[i%COLORS.length]}}/><span>{x.name}</span><b>{num(x.value,1)}%</b></div>)}</div></div>
        </section>

        <section className={s.lowerGrid}>
          <div className={s.tableCard}><div className={s.cardHead}><div><span>Current book</span><h2>Top Holdings</h2></div><button onClick={()=>setTab('Portfolio')}>View full portfolio →</button></div><table><thead><tr><th>Company</th><th>Weight</th><th>Cost</th><th>Current value</th><th>Return</th></tr></thead><tbody>{holdings.slice().sort((a,b)=>b.weight-a.weight).slice(0,5).map(h=><tr key={h.symbol}><td>{h.name}</td><td>{num(h.weight,1)}%</td><td>{inr(h.cost,true)}</td><td>{inr(h.value,true)}</td><td className={tone(h.returnPct)}>{pct(h.returnPct)}</td></tr>)}</tbody></table></div>
          <div className={s.researchTeaser}><div className={s.cardHead}><div><span>Latest thinking</span><h2>Research / Journal</h2></div><button onClick={()=>setTab('Research')}>View all →</button></div>{lab.research?.[0]&&<article><small>{lab.research[0].type} · {lab.research[0].date}</small><h3>{lab.research[0].title}</h3><p>{lab.research[0].summary}</p><div className={s.tags}>{lab.research[0].tags?.map(t=><span key={t}>{t}</span>)}</div></article>}</div>
          <div className={s.riskCard}><div className={s.cardHead}><div><span>Risk</span><h2>Risk Analytics</h2></div></div><div className={s.riskGrid}><Stat label="Volatility" value={`${num(lab.risk.volatility,1)}%`}/><Stat label="Sharpe ratio" value={num(lab.risk.sharpe,2)}/><Stat label="Max drawdown" value={`${num(lab.risk.maxDrawdown,1)}%`} positive={false}/><Stat label="Beta" value={num(lab.risk.beta,2)}/><Stat label="Alpha" value={pct(lab.risk.alpha)} positive/><Stat label="VaR (95%, 1-day)" value={`${num(lab.risk.var95,1)}%`} positive={false}/></div></div>
        </section>
      </>}

      {tab==='Portfolio'&&<section className={s.panel}>
        <div className={s.panelHead}><div><p className={s.kicker}>Portfolio construction</p><h2>Current Holdings</h2><p>Weights, performance, thesis and position-level monitoring.</p></div><div className={s.search}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search holding, sector, asset…"/></div></div>
        <div className={s.portfolioGrid}>
          <div className={s.holdingsList}>{filteredHoldings.map(h=><button key={h.symbol} onClick={()=>setSelected(h.symbol)} className={selectedHolding?.symbol===h.symbol?s.holdingOn:''}><div><strong>{h.name}</strong><span>{h.symbol} · {h.sector}</span></div><div><b>{num(h.weight,1)}%</b><small className={tone(h.returnPct)}>{pct(h.returnPct)}</small></div></button>)}</div>
          {selectedHolding&&<article className={s.holdingDetail}><div className={s.detailTop}><div><span>{selectedHolding.symbol}</span><h3>{selectedHolding.name}</h3><p>{selectedHolding.sector} · {selectedHolding.asset}</p></div><div className={tone(selectedHolding.returnPct)}>{pct(selectedHolding.returnPct)}</div></div><div className={s.detailStats}><Stat label="Portfolio weight" value={`${num(selectedHolding.weight,1)}%`}/><Stat label="Cost" value={inr(selectedHolding.cost,true)}/><Stat label="Current value" value={inr(selectedHolding.value,true)}/><Stat label="Day move" value={pct(selectedHolding.dayPct)} positive={selectedHolding.dayPct>=0}/></div><div className={s.thesis}><span>Investment thesis</span><p>{selectedHolding.thesis}</p></div></article>}
        </div>
      </section>}

      {tab==='Research'&&<section className={s.panel}>
        <div className={s.panelHead}><div><p className={s.kicker}>Research archive</p><h2>Ideas before outcomes</h2><p>Company notes, sector work and thematic research preserved with the original thesis.</p></div></div>
        <div className={s.filters}>{researchTypes.map(t=><button key={t} className={researchFilter===t?s.filterOn:''} onClick={()=>setResearchFilter(t)}>{t}</button>)}</div>
        <div className={s.researchGrid}>{visibleResearch.map(r=><article key={r.id}><div className={s.articleTop}><span>{r.type}</span><small>{r.date}</small></div><h3>{r.title}</h3><p>{r.summary}</p><div className={s.thesis}><span>Current thesis</span><p>{r.thesis}</p></div><div className={s.articleBottom}><div className={s.tags}>{r.tags?.map(t=><span key={t}>{t}</span>)}</div><b>{r.status}</b></div></article>)}</div>
      </section>}

      {tab==='Journal'&&<section className={s.panel}>
        <div className={s.panelHead}><div><p className={s.kicker}>Decision journal</p><h2>What I decided — and why</h2><p>A record of adds, trims, passes and reviews so hindsight cannot rewrite the original reasoning.</p></div></div>
        <div className={s.journal}>{(lab.journal||[]).map((j,i)=><article key={j.id}><div className={s.journalIndex}>{String(i+1).padStart(2,'0')}</div><div className={s.journalDate}>{j.date}</div><div className={s.action} data-action={j.action}>{j.action}</div><div><h3>{j.holding}</h3><p>{j.note}</p></div></article>)}</div>
      </section>}

      {tab==='Analytics'&&<section className={s.panel}>
        <div className={s.panelHead}><div><p className={s.kicker}>Risk & attribution</p><h2>Return is only half the story</h2><p>Volatility, downside, benchmark sensitivity and where performance actually came from.</p></div></div>
        <div className={s.analyticsStats}><Stat label="Volatility" value={`${num(lab.risk.volatility,1)}%`}/><Stat label="Sharpe" value={num(lab.risk.sharpe,2)}/><Stat label="Sortino" value={num(lab.risk.sortino,2)}/><Stat label="Max drawdown" value={`${num(lab.risk.maxDrawdown,1)}%`} positive={false}/><Stat label="Beta vs NIFTY" value={num(lab.risk.beta,2)}/><Stat label="Alpha annualized" value={pct(lab.risk.alpha)} positive/></div>
        <div className={s.analyticsGrid}><div className={s.chartCard}><div className={s.cardHead}><div><span>Attribution</span><h2>Contribution by exposure</h2></div></div><div className={s.barChart}><ResponsiveContainer width="100%" height="100%"><BarChart data={lab.attribution} layout="vertical"><CartesianGrid horizontal={false} stroke="rgba(26,24,24,.08)"/><XAxis type="number" tick={{fontSize:10}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={90} tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>`${num(v,1)} pp`}/><Bar dataKey="contribution" fill="#244d86" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></div><div className={s.analyticsNotes}><h3>How I use this</h3><ul><li><ShieldCheck size={16}/>Check whether returns came from repeatable security selection or one concentrated bet.</li><li><Gauge size={16}/>Compare realised volatility and drawdown against the return earned.</li><li><Activity size={16}/>Track beta and benchmark-relative alpha rather than absolute return alone.</li><li><LineChartIcon size={16}/>Use attribution to decide where future research time should go.</li></ul></div></div>
      </section>}

      <footer className={s.footer}><div><strong>Educational portfolio</strong><span>This Investment Lab is a personal research and learning environment, not investment advice.</span></div><div><RefreshCw size={13}/><span>{liveState==='live'?`Live endpoint connected · ${lab.asOf}`:'Manual snapshot active · connect your market API from Admin when ready'}</span></div></footer>
    </main>
  </div>
}
