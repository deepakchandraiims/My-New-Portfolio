const FUNCTION_BASE = 'https://mnppdqrhnpllzafufhtd.supabase.co/functions/v1/portfolio-api'

export async function proxyPortfolioRequest(request, path) {
  const sourceUrl = new URL(request.url)
  const targetUrl = new URL(`${FUNCTION_BASE}${path}`)
  targetUrl.search = sourceUrl.search

  const headers = {}
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
