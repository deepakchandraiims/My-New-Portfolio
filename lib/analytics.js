// Minimal client-side event tracking. Fires pageviews, project views, and
// resume clicks to /api/analytics/track. Uses sendBeacon when available so
// events aren't lost on navigation/unload; falls back to a keepalive fetch.

const SID_KEY = 'portfolio_sid'

function getSessionId() {
  if (typeof window === 'undefined') return null
  try {
    let sid = window.localStorage.getItem(SID_KEY)
    if (!sid) {
      sid = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(SID_KEY, sid)
    }
    return sid
  } catch {
    return null
  }
}

export function trackEvent(type, payload = {}) {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({
      type,
      sessionId: getSessionId(),
      path: window.location.pathname,
      referrer: document.referrer || '',
      ...payload,
    })
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon('/api/analytics/track', blob)
      if (ok) return
    }
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Analytics must never break the site.
  }
}
