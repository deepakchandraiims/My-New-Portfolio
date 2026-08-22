'use client'

import { useEffect } from 'react'

const MAP = {
  'Hero Profile': 'Owner',
  'About / Story': 'Chapters',
  'Featured Projects': 'Projects',
  'Transactions': 'Transactions',
  'Experience': 'Experience',
  'Education': 'Education',
  'Certifications': 'Certifications',
  'Testimonials': 'Testimonials',
  'Aspirational Firms': 'Aspirations',
  'Expertise': 'Expertise',
  'SEO Settings': 'SEO',
  'Settings': 'Danger zone',
}

function syncSection(targetLabel) {
  const host = document.querySelector('.admin-legacy-editor')
  if (!host) return false

  // Ensure the legacy editor is on the Content tab first.
  const contentButton = [...host.querySelectorAll('button')].find(
    (b) => (b.textContent || '').trim() === 'Content'
  )
  contentButton?.click()

  const clickTarget = () => {
    const sectionButton = [...host.querySelectorAll('aside button')].find(
      (b) => (b.textContent || '').trim() === targetLabel
    )
    if (!sectionButton) return false
    sectionButton.click()
    return true
  }

  if (clickTarget()) return true
  setTimeout(clickTarget, 20)
  return true
}

export default function AdminSectionSync() {
  useEffect(() => {
    const handler = (event) => {
      const button = event.target?.closest?.('button')
      if (!button) return
      if (button.closest('.admin-legacy-editor')) return

      const visibleLabel = (button.textContent || '').trim()
      const targetLabel = MAP[visibleLabel]
      if (!targetLabel) return

      // Run after the dashboard shell updates its own selected view.
      ;[0, 40, 120, 260].forEach((ms) => setTimeout(() => syncSection(targetLabel), ms))
    }

    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  return null
}
