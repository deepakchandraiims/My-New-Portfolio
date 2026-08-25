'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const QUOTES = [
  ['Price is what you pay. Value is what you get.', 'Warren Buffett'],
  ['The intelligent investor is a realist who sells to optimists and buys from pessimists.', 'Benjamin Graham'],
  ['The big money is not in the buying and selling, but in the waiting.', 'Charlie Munger'],
  ["You can’t predict. You can prepare.", 'Howard Marks'],
  ['Know what you own, and know why you own it.', 'Peter Lynch'],
  ["Don’t look for the needle in the haystack. Just buy the haystack.", 'John C. Bogle'],
  ['He who lives by the crystal ball will eat shattered glass.', 'Ray Dalio'],
  ['The essence of investment management is the management of risks, not the management of returns.', 'Benjamin Graham'],
  ["It’s not whether you’re right or wrong, but how much money you make when you’re right.", 'George Soros'],
  ['Diversification is the only free lunch in finance.', 'Harry Markowitz'],
]

function QuoteItems() {
  return QUOTES.map(([quote, author], index) => (
    <div key={`${author}-${index}`} className="hq-item shrink-0 flex items-center gap-3 px-7 md:px-10">
      <span className="font-serif text-[16px] md:text-[18px] text-slate-700 whitespace-nowrap">“{quote}”</span>
      <span className="text-[10px] md:text-[11px] uppercase tracking-[.17em] font-semibold text-blue-600 whitespace-nowrap">— {author}</span>
      <span className="ml-4 h-1 w-1 rounded-full bg-slate-300" />
    </div>
  ))
}

export default function HeroQuoteMarquee() {
  const [mount, setMount] = useState(null)

  useEffect(() => {
    let slot = null
    let observer = null

    const install = () => {
      const top = document.getElementById('top')
      if (!top) return false
      if (top.querySelector('[data-hero-quote-slot="1"]')) return true

      slot = document.createElement('div')
      slot.dataset.heroQuoteSlot = '1'
      slot.className = 'hero-quote-marquee-slot'
      top.appendChild(slot)
      setMount(slot)
      return true
    }

    if (!install()) {
      observer = new MutationObserver(() => {
        if (install()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      observer?.disconnect()
      slot?.remove()
    }
  }, [])

  if (!mount) return null

  return createPortal(
    <>
      <style jsx global>{`
        .hero-quote-marquee-slot {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 28px;
          z-index: 20;
        }
        .hq-shell {
          border-top: 1px solid rgba(226,232,240,.95);
          border-bottom: 1px solid rgba(226,232,240,.95);
          background: rgba(255,255,255,.72);
          backdrop-filter: blur(10px);
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%);
        }
        .hq-track {
          width: max-content;
          display: flex;
          align-items: center;
          animation: hq-marquee-right 112s linear infinite;
          will-change: transform;
        }
        .hq-shell:hover .hq-track { animation-play-state: paused; }
        @keyframes hq-marquee-right {
          from { transform: translate3d(-50%,0,0); }
          to { transform: translate3d(0,0,0); }
        }
        @media (max-width: 1023px) {
          .hero-quote-marquee-slot {
            position: relative;
            inset: auto;
            margin-top: 28px;
          }
          .hq-track { animation-duration: 132s; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hq-shell { overflow-x: auto; mask-image: none; -webkit-mask-image: none; }
          .hq-track { animation: none; }
        }
      `}</style>
      <div className="hq-shell py-4 md:py-5" aria-label="Investment philosophy quotes">
        <div className="hq-track">
          <div className="flex items-center"><QuoteItems /></div>
          <div className="flex items-center" aria-hidden="true"><QuoteItems /></div>
        </div>
      </div>
    </>,
    mount,
  )
}
