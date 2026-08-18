const FUNCTION_BASE = 'https://mnppdqrhnpllzafufhtd.supabase.co/functions/v1/portfolio-api'

// Supabase's legacy anon JWT is intentionally a public client credential.
// It only authenticates requests at the function gateway; privileged database
// work remains inside the Edge Function and admin writes still require the
// existing x-admin-token.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucHBkcXJobnBsbHphZnVmaHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDIzMzksImV4cCI6MjEwMjYxODMzOX0.gv4SNqsCMB8D7tb1c6xniL13kFtoFSsnJZpq6UVQQso'

export async function proxyPortfolioRequest(request, path) {
  const sourceUrl = new URL(request.url)
  const targetUrl = new URL(`${FUNCTION_BASE}${path}`)
  targetUrl.search = sourceUrl.search

  const headers = {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  }

  const adminToken = request.headers.get('x-admin-token')
  if (adminToken) headers['x-admin-token'] = adminToken

  const contentType = request.headers.get('content-type')
  if (contentType) headers['Content-Type'] = contentType

  const init = {
    method: request.method,
    headers,
    cache: 'no-store',
  }

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    init.body = await request.text()
  }

  const response = await fetch(targetUrl, init)
  const body = await response.text()

  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
