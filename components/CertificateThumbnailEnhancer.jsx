'use client'

import { useEffect } from 'react'

const INDEX = {
  'Finance & Quantitative Modeling for Analysts': 0,
  'Communication / Soft Skills': 1,
  'Advanced Modelling': 2,
  'How to Build an Equity Research Report': 3,
  'Artificial Intelligence & Generative AI': 4,
  'Microsoft Excel Complete Mastery': 5,
  'Investment Banking Overview': 6,
  'Financial Modelling & Valuations': 7,
  'Oracle Fusion Smart View / Financial Reporting Studio / OTBI': 8,
  'Commercial Banking Job Simulation': 9,
  'Become a Data Analyst': 10,
  'MS Excel': 11,
  'CFI Corporate Finance Foundations Professional Certificate': 12,
  'Career Essentials in Project Management': 13,
  'Stock Valuation with Comparable Companies Analysis': 14,
}

export default function CertificateThumbnailEnhancer() {
  useEffect(() => {
    let observer
    let timer

    const start = () => {
      const mount = document.getElementById('complete-certificates-gallery-mount')
      if (!mount) return false

      const apply = () => {
        mount.querySelectorAll('article').forEach((card) => {
          if (card.querySelector('[data-certificate-preview]')) return
          const title = card.querySelector('h3')?.textContent?.trim()
          const index = INDEX[title]
          if (index === undefined) return

          const preview = document.createElement('div')
          preview.dataset.certificatePreview = 'true'
          preview.setAttribute('role', 'img')
          preview.setAttribute('aria-label', `${title} certificate preview`)
          preview.style.height = '168px'
          preview.style.margin = '-4px -4px 16px'
          preview.style.border = '1px solid rgb(226 232 240)'
          preview.style.borderRadius = '12px'
          preview.style.backgroundColor = '#f8fafc'
          preview.style.backgroundImage = "url('/certificates-sprite')"
          preview.style.backgroundRepeat = 'no-repeat'
          preview.style.backgroundSize = '100% 1500%'
          preview.style.backgroundPosition = `center ${(index / 14) * 100}%`
          preview.style.boxShadow = '0 8px 20px -18px rgba(15,23,42,.35)'
          card.prepend(preview)
        })
      }

      apply()
      observer = new MutationObserver(apply)
      observer.observe(mount, { childList: true, subtree: true })
      return true
    }

    if (!start()) {
      timer = window.setInterval(() => {
        if (start()) window.clearInterval(timer)
      }, 120)
    }

    return () => {
      if (timer) window.clearInterval(timer)
      observer?.disconnect()
    }
  }, [])

  return null
}
