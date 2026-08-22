import { NextResponse } from 'next/server'
import { SEED_CONTENT } from '@/lib/portfolio-data'
import { RECRUITER_PROJECTS, RECRUITER_PROJECT_CATEGORIES } from '@/lib/recruiter-projects'

export const runtime = 'nodejs'

const CONTENT_API = 'https://mnppdqrhnpllzafufhtd.supabase.co/functions/v1/content-api'

function json(body, init) {
  const res = NextResponse.json(body, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

async function callContentApi(request, method, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = request?.headers?.get?.('x-admin-token')
  if (token) headers['x-admin-token'] = token

  const response = await fetch(CONTENT_API, {
    method,
    headers,
    cache: 'no-store',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { ok: false, status: response.status, payload }
  }
  return { ok: true, status: response.status, payload }
}

export async function GET(request) {
  try {
    const upstream = await callContentApi(request, 'GET')
    const overrides = upstream.ok && upstream.payload && typeof upstream.payload === 'object'
      ? upstream.payload
      : {}

    const content = {
      ...SEED_CONTENT,
      ...overrides,
      categories: Array.isArray(overrides.categories) && overrides.categories.length
        ? overrides.categories
        : RECRUITER_PROJECT_CATEGORIES,
      projects: Array.isArray(overrides.projects) && overrides.projects.length
        ? overrides.projects
        : RECRUITER_PROJECTS,
    }

    return json(content)
  } catch (error) {
    return json({
      ...SEED_CONTENT,
      categories: RECRUITER_PROJECT_CATEGORIES,
      projects: RECRUITER_PROJECTS,
      _warning: String(error?.message || error),
    })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const upstream = await callContentApi(request, 'PATCH', body)
    if (!upstream.ok) return json(upstream.payload, { status: upstream.status })
    return json(upstream.payload)
  } catch (error) {
    return json({ error: 'Partial save failed', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()

    // Backward compatibility: certificate uploader may send a full page object.
    // Persist it as-is in Supabase; certificate-only updates should use PATCH.
    const upstream = await callContentApi(request, 'PUT', body)
    if (!upstream.ok) return json(upstream.payload, { status: upstream.status })
    return json(upstream.payload)
  } catch (error) {
    return json({ error: 'Save failed', detail: String(error?.message || error) }, { status: 500 })
  }
}
