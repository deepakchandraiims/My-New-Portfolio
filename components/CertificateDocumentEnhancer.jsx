'use client'

import { useEffect } from 'react'

const SLUG_BY_TITLE = {
  'Finance & Quantitative Modeling for Analysts': 'wharton-finance-quant',
  'Communication / Soft Skills': 'jobaaj-soft-skills',
  'Advanced Modelling': 'jobaaj-advanced-modeling',
  'How to Build an Equity Research Report': 'jobaaj-equity-research',
  'Artificial Intelligence & Generative AI': 'jobaaj-genai',
  'Microsoft Excel Complete Mastery': 'jobaaj-excel-mastery',
  'Investment Banking Overview': 'jobaaj-investment-banking',
  'Financial Modelling & Valuations': 'jobaaj-financial-modeling-valuation',
  'Oracle Fusion Smart View / Financial Reporting Studio / OTBI': 'oracle-otbi',
  'Commercial Banking Job Simulation': 'jpmorgan-commercial-banking',
  'Become a Data Analyst': 'linkedin-data-analyst',
  'MS Excel': 'learnvern-excel',
  'CFI Corporate Finance Foundations Professional Certificate': 'cfi-corporate-finance',
  'Career Essentials in Project Management': 'microsoft-project-management',
  'Stock Valuation with Comparable Companies Analysis': 'coursera-stock-valuation',
}

function addRealDocument(card, doc, title) {
  if (!doc?.url || card.dataset.realCertificateBound === doc.url) return
  card.dataset.realCertificateBound = doc.url

  card.querySelectorAll('[data-real-certificate-document], [data-real-certificate-link]').forEach((el) => el.remove())
  const oldPreview = card.querySelector('[data-certificate-preview]')
  if (oldPreview) oldPreview.style.display = 'none'

  const link = document.createElement('a')
  link.dataset.realCertificateDocument = 'true'
  link.href = doc.url
  link.target = '_blank'
  link.rel = 'noreferrer'
  link.title = `Open ${title}`
  link.style.display = 'block'
  link.style.height = '190px'
  link.style.margin = '-4px -4px 16px'
  link.style.border = '1px solid rgb(226 232 240)'
  link.style.borderRadius = '12px'
  link.style.overflow = 'hidden'
  link.style.background = '#f8fafc'
  link.style.position = 'relative'
  link.style.boxShadow = '0 10px 24px -20px rgba(15,23,42,.4)'

  const isPdf = (doc.mimeType || '').includes('pdf') || /\.pdf(?:$|\?)/i.test(doc.url)
  if (isPdf) {
    const frame = document.createElement('iframe')
    frame.src = `${doc.url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`
    frame.title = `${title} certificate PDF`
    frame.loading = 'lazy'
    frame.tabIndex = -1
    frame.style.width = '100%'
    frame.style.height = '100%'
    frame.style.border = '0'
    frame.style.pointerEvents = 'none'
    frame.style.background = 'white'
    link.appendChild(frame)
  } else {
    const img = document.createElement('img')
    img.src = doc.url
    img.alt = `${title} certificate`
    img.loading = 'lazy'
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'contain'
    img.style.background = 'white'
    link.appendChild(img)
  }

  const badge = document.createElement('span')
  badge.textContent = isPdf ? 'PDF · click to open' : 'Certificate · click to open'
  badge.style.position = 'absolute'
  badge.style.right = '8px'
  badge.style.bottom = '8px'
  badge.style.padding = '5px 8px'
  badge.style.borderRadius = '999px'
  badge.style.background = 'rgba(15,23,42,.82)'
  badge.style.color = 'white'
  badge.style.fontSize = '9px'
  badge.style.letterSpacing = '.04em'
  link.appendChild(badge)
  card.prepend(link)

  const footer = card.querySelector('div.mt-auto') || card.lastElementChild
  if (footer) {
    const open = document.createElement('a')
    open.dataset.realCertificateLink = 'true'
    open.href = doc.url
    open.target = '_blank'
    open.rel = 'noreferrer'
    open.textContent = isPdf ? 'View actual PDF ↗' : 'View full certificate ↗'
    open.style.display = 'inline-flex'
    open.style.marginTop = '10px'
    open.style.marginRight = '12px'
    open.style.fontSize = '10.5px'
    open.style.fontWeight = '600'
    open.style.color = '#2563eb'
    footer.appendChild(open)
  }
}

export default function CertificateDocumentEnhancer() {
  useEffect(() => {
    let cancelled = false
    let docs = {}
    let observer
    let timer

    const bind = () => {
      const mount = document.getElementById('complete-certificates-gallery-mount')
      if (!mount) return false
      mount.querySelectorAll('article').forEach((card) => {
        const title = card.querySelector('h3')?.textContent?.trim()
        const slug = SLUG_BY_TITLE[title]
        if (!slug || !docs[slug]?.url) return
        addRealDocument(card, docs[slug], title)
      })
      if (!observer) {
        observer = new MutationObserver(bind)
        observer.observe(mount, { childList: true, subtree: true })
      }
      return true
    }

    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.json())
      .then((content) => {
        if (cancelled) return
        docs = content?.certificateDocuments || {}
        if (!bind()) timer = setInterval(() => { if (bind()) clearInterval(timer) }, 200)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      observer?.disconnect()
    }
  }, [])

  return null
}
