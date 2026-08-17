import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getSupabase, ensureBucket, BUCKET, categoryFromMime, slugifyName } from '@/lib/supabase'
import { SEED_CONTENT } from '@/lib/portfolio-data'

export const runtime = 'nodejs'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

function requireAdmin(request) {
  const token = request.headers.get('x-admin-token')
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return true // no password set = open (dev)
  if (token && token === expected) return true
  return false
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Health
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Portfolio API online', ts: Date.now() }))
    }

    // ---------------- Contact ----------------
    if (route === '/contact' && method === 'POST') {
      const body = await request.json()
      if (!body.email || !body.message) {
        return handleCORS(NextResponse.json({ error: 'email and message are required' }, { status: 400 }))
      }
      const record = {
        id: uuidv4(),
        name: body.name || '',
        email: body.email,
        company: body.company || '',
        role: body.role || '',
        message: body.message,
        recruiterMode: !!body.recruiterMode,
        createdAt: new Date(),
      }
      await db.collection('contact_requests').insertOne(record)
      const { _id, ...safe } = record
      return handleCORS(NextResponse.json({ ok: true, request: safe }))
    }
    if (route === '/contact' && method === 'GET') {
      const docs = await db.collection('contact_requests').find({}).sort({ createdAt: -1 }).limit(100).toArray()
      return handleCORS(NextResponse.json(docs.map(({ _id, ...r }) => r)))
    }

    // ---------------- Files ----------------

    // POST /api/files/upload  — multipart, single or multi file
    if (route === '/files/upload' && method === 'POST') {
      if (!requireAdmin(request)) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      await ensureBucket()
      const supabase = getSupabase()

      const form = await request.formData()
      const file = form.get('file')
      const projectId = form.get('projectId') || null
      const projectTitle = form.get('projectTitle') || null
      const label = form.get('label') || null

      if (!file || typeof file === 'string') {
        return handleCORS(NextResponse.json({ error: 'file is required' }, { status: 400 }))
      }

      const originalName = file.name || 'upload.bin'
      const mimeType = file.type || 'application/octet-stream'
      const size = file.size || 0

      if (size > 50 * 1024 * 1024) {
        return handleCORS(NextResponse.json({ error: 'file exceeds 50MB' }, { status: 413 }))
      }

      const arrayBuf = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuf)

      const id = uuidv4()
      const safeName = slugifyName(originalName)
      const key = `${projectId || 'unassigned'}/${Date.now()}-${id.slice(0, 8)}-${safeName}`

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buffer, {
        contentType: mimeType,
        upsert: false,
      })
      if (upErr) {
        console.error('Supabase upload error:', upErr)
        return handleCORS(NextResponse.json({ error: 'storage upload failed', detail: upErr.message }, { status: 502 }))
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key)
      const publicUrl = pub?.publicUrl
      const category = categoryFromMime(mimeType, originalName)

      const record = {
        id,
        originalName,
        label: label || originalName,
        mimeType,
        size,
        category,
        storageKey: key,
        publicUrl,
        projectId: projectId || null,
        projectTitle: projectTitle || null,
        createdAt: new Date(),
      }

      await db.collection('files').insertOne(record)
      const { _id, ...safe } = record
      return handleCORS(NextResponse.json({ ok: true, file: safe }, { status: 201 }))
    }

    // GET /api/files  — list, optional ?projectId=
    if (route === '/files' && method === 'GET') {
      const url = new URL(request.url)
      const projectId = url.searchParams.get('projectId')
      const query = projectId ? { projectId } : {}
      const docs = await db.collection('files').find(query).sort({ createdAt: -1 }).limit(500).toArray()
      return handleCORS(NextResponse.json(docs.map(({ _id, ...r }) => r)))
    }

    // DELETE /api/files/:id
    if (route.startsWith('/files/') && method === 'DELETE') {
      if (!requireAdmin(request)) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const id = route.replace('/files/', '')
      const doc = await db.collection('files').findOne({ id })
      if (!doc) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))

      const supabase = getSupabase()
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([doc.storageKey])
      if (rmErr) console.error('Supabase delete error:', rmErr)

      await db.collection('files').deleteOne({ id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // PATCH /api/files/:id  — attach/rename
    if (route.startsWith('/files/') && method === 'PATCH') {
      if (!requireAdmin(request)) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const id = route.replace('/files/', '')
      const body = await request.json()
      const update = {}
      if (body.projectId !== undefined) update.projectId = body.projectId || null
      if (body.projectTitle !== undefined) update.projectTitle = body.projectTitle || null
      if (body.label !== undefined) update.label = body.label
      const res = await db.collection('files').findOneAndUpdate(
        { id },
        { $set: update },
        { returnDocument: 'after' }
      )
      if (!res || !res.value) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      const { _id, ...safe } = res.value
      return handleCORS(NextResponse.json({ ok: true, file: safe }))
    }

    // ---------------- Analytics ----------------

    // POST /api/analytics/track — public, fire-and-forget event capture
    if (route === '/analytics/track' && method === 'POST') {
      let body
      try { body = await request.json() } catch { body = null }
      const allowed = ['pageview', 'project_view', 'resume_click']
      if (!body || !allowed.includes(body.type)) {
        return handleCORS(NextResponse.json({ error: 'invalid event type' }, { status: 400 }))
      }
      const record = {
        id: uuidv4(),
        type: body.type,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 100) : null,
        projectId: body.projectId || null,
        projectTitle: body.projectTitle || null,
        path: typeof body.path === 'string' ? body.path.slice(0, 300) : null,
        referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : null,
        userAgent: request.headers.get('user-agent') || null,
        createdAt: new Date(),
      }
      await db.collection('analytics_events').insertOne(record)
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // GET /api/analytics/summary — admin-only aggregated stats
    if (route === '/analytics/summary' && method === 'GET') {
      if (!requireAdmin(request)) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const url = new URL(request.url)
      const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10) || 30))
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const col = db.collection('analytics_events')

      const [allTimePageviews, allTimeProjectViews, allTimeResumeClicks] = await Promise.all([
        col.countDocuments({ type: 'pageview' }),
        col.countDocuments({ type: 'project_view' }),
        col.countDocuments({ type: 'resume_click' }),
      ])

      const [rangePageviews, rangeProjectViews, rangeResumeClicks, rangeSessions] = await Promise.all([
        col.countDocuments({ type: 'pageview', createdAt: { $gte: since } }),
        col.countDocuments({ type: 'project_view', createdAt: { $gte: since } }),
        col.countDocuments({ type: 'resume_click', createdAt: { $gte: since } }),
        col.distinct('sessionId', { type: 'pageview', createdAt: { $gte: since } }),
      ])

      const dailyAgg = await col.aggregate([
        { $match: { type: 'pageview', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]).toArray()
      const dailyMap = Object.fromEntries(dailyAgg.map((d) => [d._id, d.count]))
      const dailySeries = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().slice(0, 10)
        dailySeries.push({ date: key, pageviews: dailyMap[key] || 0 })
      }

      const topProjectsAgg = await col.aggregate([
        { $match: { type: 'project_view', createdAt: { $gte: since }, projectId: { $ne: null } } },
        { $group: { _id: { projectId: '$projectId', projectTitle: '$projectTitle' }, views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
      ]).toArray()
      const topProjects = topProjectsAgg.map((p) => ({ projectId: p._id.projectId, projectTitle: p._id.projectTitle || p._id.projectId, views: p.views }))

      return handleCORS(NextResponse.json({
        allTime: { pageviews: allTimePageviews, projectViews: allTimeProjectViews, resumeClicks: allTimeResumeClicks },
        range: { days, pageviews: rangePageviews, uniqueVisitors: (rangeSessions || []).filter(Boolean).length, projectViews: rangeProjectViews, resumeClicks: rangeResumeClicks },
        dailySeries,
        topProjects,
      }))
    }

    // ---------------- Admin auth ----------------
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json()
      const expected = process.env.ADMIN_PASSWORD
      if (!expected || body?.password === expected) {
        return handleCORS(NextResponse.json({ ok: true, token: expected || 'open' }))
      }
      return handleCORS(NextResponse.json({ error: 'invalid password' }, { status: 401 }))
    }

    // ---------------- Site content (whole-site CMS) ----------------
    if (route === '/content' && method === 'GET') {
      let doc = await db.collection('site_content').findOne({ id: 'main' })
      if (!doc) {
        doc = { id: 'main', content: SEED_CONTENT, updatedAt: new Date() }
        await db.collection('site_content').insertOne(doc)
      }
      return handleCORS(NextResponse.json(doc.content))
    }

    if (route === '/content' && method === 'PUT') {
      if (!requireAdmin(request)) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json()
      if (!body || typeof body !== 'object') return handleCORS(NextResponse.json({ error: 'invalid payload' }, { status: 400 }))
      // Minimal shape validation
      const shape = ['owner', 'chapters', 'categories', 'projects', 'skills', 'experience']
      for (const k of shape) if (!(k in body)) return handleCORS(NextResponse.json({ error: `missing key: ${k}` }, { status: 400 }))
      await db.collection('site_content').updateOne(
        { id: 'main' },
        { $set: { id: 'main', content: body, updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ ok: true, updatedAt: new Date() }))
    }

    if (route === '/content/reset' && method === 'POST') {
      if (!requireAdmin(request)) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      await db.collection('site_content').updateOne(
        { id: 'main' },
        { $set: { id: 'main', content: SEED_CONTENT, updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ ok: true, content: SEED_CONTENT }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', detail: String(error?.message || error) }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
