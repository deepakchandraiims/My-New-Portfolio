export const dynamic = 'force-dynamic'

export async function GET(request) {
  const url = new URL(request.url)
  if (url.searchParams.get('run') !== 'logos-v1') {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  const response = await fetch('https://mnppdqrhnpllzafufhtd.supabase.co/functions/v1/import-tool-logos', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-run-token': 'tool-logo-import-20260822-v1-7f31c8',
    },
    body: '{}',
    cache: 'no-store',
  })
  const text = await response.text()
  return new Response(text, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' },
  })
}
