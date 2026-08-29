const FUNCTION_BASE = 'https://mnppdqrhnpllzafufhtd.supabase.co/functions/v1/project-ai-api'

export const runtime = 'nodejs'

async function proxy(request, { params }) {
  const { path = [] } = await params
  const target = new URL(`${FUNCTION_BASE}/${path.join('/')}`)
  target.search = new URL(request.url).search

  const headers = {}
  const adminToken = request.headers.get('x-admin-token')
  if (adminToken) headers['x-admin-token'] = adminToken
  const contentType = request.headers.get('content-type')
  if (contentType) headers['Content-Type'] = contentType

  const init = { method: request.method, headers, cache: 'no-store' }
  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) init.body = await request.text()

  const response = await fetch(target, init)
  return new Response(await response.text(), {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
