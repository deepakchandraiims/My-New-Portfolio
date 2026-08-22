import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { SEED_CONTENT } from '@/lib/portfolio-data'
import { RECRUITER_PROJECTS, RECRUITER_PROJECT_CATEGORIES } from '@/lib/recruiter-projects'

export const runtime = 'nodejs'

const MIGRATION = 'recruiter-30-projects-v2'
const FALLBACK_HASH = '58f67ecff7dae550c76dc6ea5192ed1475317f655c13232c1151e39bb3708657'
let client
let db

function sha256(v = '') { return createHash('sha256').update(String(v)).digest('hex') }
function expectedHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return String(process.env.ADMIN_PASSWORD_HASH).trim().toLowerCase()
  if (process.env.ADMIN_PASSWORD) return sha256(process.env.ADMIN_PASSWORD)
  return FALLBACK_HASH
}
function isAdmin(request) {
  const token = request.headers.get('x-admin-token')
  if (!token) return false
  const actual = Buffer.from(sha256(token), 'hex')
  const expected = Buffer.from(expectedHash(), 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
async function getDb() {
  if (db) return db
  if (!process.env.MONGO_URL || !process.env.DB_NAME) throw new Error('Database is not configured')
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 8000 })
    await client.connect()
  }
  db = client.db(process.env.DB_NAME)
  return db
}
function json(body, init) {
  const res = NextResponse.json(body, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function GET() {
  try {
    const database = await getDb()
    let doc = await database.collection('site_content').findOne({ id: 'main' })
    const base = doc?.content || SEED_CONTENT

    if (!doc || doc.projectCatalogMigration !== MIGRATION) {
      const content = {
        ...base,
        categories: RECRUITER_PROJECT_CATEGORIES,
        projects: RECRUITER_PROJECTS,
      }
      await database.collection('site_content').updateOne(
        { id: 'main' },
        { $set: { id: 'main', content, projectCatalogMigration: MIGRATION, updatedAt: new Date() } },
        { upsert: true }
      )
      return json(content)
    }

    return json(doc.content)
  } catch (error) {
    return json({ error: 'Content unavailable', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function PUT(request) {
  if (!isAdmin(request)) return json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const required = ['owner', 'chapters', 'categories', 'projects', 'skills', 'experience']
    for (const key of required) if (!(key in body)) return json({ error: `missing key: ${key}` }, { status: 400 })
    const database = await getDb()
    await database.collection('site_content').updateOne(
      { id: 'main' },
      { $set: { id: 'main', content: body, projectCatalogMigration: MIGRATION, updatedAt: new Date() } },
      { upsert: true }
    )
    return json({ ok: true, updatedAt: new Date() })
  } catch (error) {
    return json({ error: 'Save failed', detail: String(error?.message || error) }, { status: 500 })
  }
}
