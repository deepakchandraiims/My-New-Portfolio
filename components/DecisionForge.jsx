'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Brain, Check, ChevronLeft, ChevronRight, CircleHelp, RotateCcw, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import { DECISION_CASES } from '@/lib/decision-cases'

const ratingLabels = ['Not considered', 'Weak', 'Developing', 'Strong', 'Excellent']

function scoreCriterion(selected, casePrinciples, rating) {
  if (!selected) return { status: 'missed', label: 'Missing', tone: 'rose' }
  const isCore = casePrinciples.some((item) => item.key === selected)
  if (isCore && rating >= 3) return { status: 'sound', label: 'Sound criterion', tone: 'emerald' }
  if (isCore) return { status: 'partial', label: 'Relevant, sharpen it', tone: 'amber' }
  if (rating >= 4) return { status: 'weak', label: 'Weak anchor', tone: 'rose' }
  return { status: 'partial', label: 'Context-dependent', tone: 'amber' }
}

export default function DecisionForge() {
  const [open, setOpen] = useState(false)
  const [caseIndex, setCaseIndex] = useState(0)
  const [step, setStep] = useState('decision')
  const [decision, setDecision] = useState('')
  const [confidence, setConfidence] = useState(3)
  const [selectedCriteria, setSelectedCriteria] = useState([])
  const [ratings, setRatings] = useState({})
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)

  const current = DECISION_CASES[caseIndex]
  const answeredCount = useMemo(() => Object.keys(ratings).length, [ratings])
  const caseNumber = caseIndex + 1

  const resetCase = (nextIndex = caseIndex) => {
    setCaseIndex(nextIndex)
    setStep('decision')
    setDecision('')
    setConfidence(3)
    setSelectedCriteria([])
    setRatings({})
    setNotes('')
    setResult(null)
  }

  const toggleCriterion = (key) => {
    setSelectedCriteria((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])
  }

  const submitReasoning = () => {
    const feedback = current.allPrinciples.map((criterion) => {
      const selected = selectedCriteria.includes(criterion.key)
      const rating = ratings[criterion.key] || 0
      return { ...criterion, selected, rating, ...scoreCriterion(selected, current.principles, rating) }
    })
    const coreHits = feedback.filter((item) => item.status === 'sound').length
    const missedCore = feedback.filter((item) => current.principles.some((core) => core.key === item.key) && !item.selected)
    setResult({ feedback, coreHits, missedCore })
    setStep('feedback')
  }

  const nextCase = () => resetCase((caseIndex + 1) % DECISION_CASES.length)
  const previousCase = () => resetCase((caseIndex - 1 + DECISION_CASES.length) % DECISION_CASES.length)

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[70] group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-4 py-3 text-[11px] font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700" aria-label="Open Decision Forge">
        <Brain className="h-4 w-4 text-blue-300 group-hover:text-white" /> Decision Forge <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-blue-200">100</span>
      </button>

      {open && <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm md:p-8">
        <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-3xl bg-[#f7f9fc] shadow-2xl md:min-h-0">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 md:px-8">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600"><Sparkles className="h-3.5 w-3.5" /> Capital Forge / Judgment Lab</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Decision Forge</h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">Make the call, explain what drove it, then get challenged on whether your criteria actually fit the decision.</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Close Decision Forge"><X className="h-4 w-4" /></button>
          </header>

          <div className="grid gap-0 md:grid-cols-[230px_1fr]">
            <aside className="border-b border-slate-200 bg-white p-5 md:border-b-0 md:border-r md:p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Case navigator</div>
              <div className="mt-4 flex items-end justify-between"><span className="text-3xl font-semibold text-slate-950">{caseNumber}</span><span className="pb-1 text-[11px] text-slate-400">/ {DECISION_CASES.length}</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(caseNumber / DECISION_CASES.length) * 100}%` }} /></div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Training signal</div><div className="mt-2 text-[12px] leading-relaxed text-slate-600">The objective is not to guess the “right” answer. It is to make your assumptions explicit and choose criteria that survive scrutiny.</div></div>
              <div className="mt-5 flex gap-2"><button onClick={previousCase} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><ChevronLeft className="mx-auto h-4 w-4" /></button><button onClick={nextCase} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><ChevronRight className="mx-auto h-4 w-4" /></button></div>
            </aside>

            <main className="p-5 md:p-8">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{current.domain}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Level {current.difficulty} / 7</span><span className="text-[10px] text-slate-400">{current.id}</span></div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">{current.title}</h3>
              <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-600">{current.prompt}</p>

              {step === 'decision' && <section className="mt-8 max-w-3xl">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400"><Target className="h-4 w-4 text-blue-600" /> Step 1 · Make the call</div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{current.decisionOptions.map((option) => <button key={option} onClick={() => setDecision(option)} className={`rounded-2xl border px-4 py-4 text-left text-[12px] font-semibold transition ${decision === option ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}>{option}{decision === option && <Check className="float-right h-4 w-4" />}</button>)}</div>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><label className="text-[12px] font-semibold text-slate-700">How confident are you?</label><span className="text-[12px] font-bold text-blue-700">{confidence} / 5</span></div><input type="range" min="1" max="5" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="mt-3 w-full accent-blue-600" /><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>Low conviction</span><span>High conviction</span></div></div>
                <button disabled={!decision} onClick={() => setStep('criteria')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-35">Explain your decision <ArrowRight className="h-4 w-4" /></button>
              </section>}

              {step === 'criteria' && <section className="mt-8 max-w-4xl">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400"><CircleHelp className="h-4 w-4 text-blue-600" /> Step 2 · Defend the criteria</div>
                <p className="mt-3 text-[12px] text-slate-500">Select the criteria you actually used. Rate how strongly each criterion influenced your decision. You can select more than one.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{current.allPrinciples.map((criterion) => { const selected = selectedCriteria.includes(criterion.key); return <button key={criterion.key} onClick={() => toggleCriterion(criterion.key)} className={`rounded-2xl border p-3 text-left transition ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}><div className="flex items-start justify-between gap-2"><span className={`text-[11px] font-semibold ${selected ? 'text-blue-800' : 'text-slate-700'}`}>{criterion.label}</span>{selected && <Check className="h-3.5 w-3.5 text-blue-600" />}</div><span className="mt-1 block text-[10px] leading-relaxed text-slate-400">{criterion.good}</span></button>})}</div>
                {selectedCriteria.length > 0 && <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-slate-700">Rate your selected criteria</span><span className="text-[10px] text-slate-400">{answeredCount} rated</span></div><div className="mt-3 space-y-3">{selectedCriteria.map((key) => { const criterion = current.allPrinciples.find((item) => item.key === key); return <div key={key} className="grid gap-2 sm:grid-cols-[1fr_1fr]"><span className="text-[11px] text-slate-600">{criterion.label}</span><div className="flex gap-1">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRatings((old) => ({ ...old, [key]: value }))} className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold ${ratings[key] === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title={ratingLabels[value - 1]}>{value}</button>)}</div></div>})}</div></div>}
                <label className="mt-5 block text-[11px] font-semibold text-slate-700">One-sentence rationale <span className="font-normal text-slate-400">(optional, but useful for your mistake journal)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What assumption or trade-off drove your call?" className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-[12px] font-normal outline-none ring-blue-200 placeholder:text-slate-300 focus:ring-2" /></label>
                <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setStep('decision')} className="rounded-xl border border-slate-200 px-4 py-3 text-[12px] font-semibold text-slate-600 hover:bg-white">Back</button><button disabled={!selectedCriteria.length || selectedCriteria.some((key) => !ratings[key])} onClick={submitReasoning} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-35">Get criterion feedback <ArrowRight className="h-4 w-4" /></button></div>
              </section>}

              {step === 'feedback' && result && <section className="mt-8 max-w-4xl">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-blue-700" /><div><div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Decision review</div><p className="mt-2 text-[13px] leading-relaxed text-blue-950">You chose <strong>{decision}</strong> with {confidence}/5 confidence. The framework found <strong>{result.coreHits} of {current.principles.length}</strong> decision-critical criteria in your reasoning.</p></div></div></div>
                {notes && <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-[12px] italic leading-relaxed text-slate-500">“{notes}”</div>}
                <div className="mt-5 space-y-2">{result.feedback.filter((item) => item.selected || current.principles.some((core) => core.key === item.key)).map((item) => <div key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.tone === 'emerald' ? 'bg-emerald-500' : item.tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} /><span className="text-[12px] font-semibold text-slate-800">{item.label}</span><span className="text-[10px] text-slate-400">{item.rating ? `${item.rating}/5 influence` : 'not selected'}</span></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : item.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{item.status === 'sound' ? 'Right direction' : item.status === 'missed' ? 'Missed' : 'Challenge'}</span></div><p className="mt-2 text-[11px] leading-relaxed text-slate-500">{item.good}</p></div>)}</div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Case benchmark</div><div className="mt-2 text-[13px] font-semibold text-slate-800">{current.recommendation}</div><p className="mt-2 text-[12px] leading-relaxed text-slate-500">{current.why}</p></div>
                <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => resetCase()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[12px] font-semibold text-slate-600 hover:bg-white"><RotateCcw className="h-4 w-4" /> Try again</button><button onClick={nextCase} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-[12px] font-semibold text-white hover:bg-blue-700">Next case <ChevronRight className="h-4 w-4" /></button></div>
              </section>}
            </main>
          </div>
        </div>
      </div>}
    </>
  )
}
