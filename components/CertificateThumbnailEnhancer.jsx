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

          const preview = document.createElement('a')
          preview.dataset.certificatePreview = 'true'
          preview.href = `/certificates-sprite?index=${index}`
          preview.target = '_blank'
          preview.rel = 'noreferrer'
          preview.setAttribute('aria-label', `Open ${title} certificate`)
          preview.style.display = 'block'
          preview.style.height = '190px'
          preview.style.margin = '-4px -4px 16px'
          preview.style.border = '1px solid rgb(226 232 240)'
          preview.style.borderRadius = '12px'
          preview.style.overflow = 'hidden'
          preview.style.background = '#fff'
          preview.style.position = 'relative'
          preview.style.boxShadow = '0 8px 20px -18px rgba(15,23,42,.35)'

          const img = document.createElement('img')
          img.src = `/certificates-sprite?index=${index}`
          img.alt = `${title} certificate`
          img.loading = 'lazy'
          img.decoding = 'async'
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'contain'
          img.style.background = '#fff'
          img.onerror = () => {
            preview.style.background = '#f8fafc'
          }
          preview.appendChild(img)

          const badge = document.createElement('span')
          badge.textContent = 'View certificate ↗'
          badge.style.position = 'absolute'
          badge.style.right = '8px'
          badge.style.bottom = '8px'
          badge.style.padding = '5px 8px'
          badge.style.borderRadius = '999px'
          badge.style.background = 'rgba(15,23,42,.82)'
          badge.style.color = 'white'
          badge.style.fontSize = '9px'
          badge.style.fontWeight = '600'
          preview.appendChild(badge)

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
