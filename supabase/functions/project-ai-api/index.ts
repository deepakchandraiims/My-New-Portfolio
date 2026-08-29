import { createClient } from 'npm:@supabase/supabase-js@2'
import { unzipSync } from 'npm:fflate@0.8.2'

const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
const serverKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const sb = createClient(Deno.env.get('SUPABASE_URL') || '', serverKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ADMIN_HASH = '58f67ecff7dae550c76dc6ea5192ed1475317f655c13232c1151e39bb3708657'
const SETTINGS_ID = 'project-analyzer'
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const MAX_FILES = 20
const MAX_EXTRACTED_CHARS_PER_FILE = 280_000
const MAX_EXTRACTED_CHARS_TOTAL = 850_000

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type,x-admin-token',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'Cache-Control': 'no-store',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
})

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function isAdmin(req: Request) {
  const token = req.headers.get('x-admin-token') || ''
  return Boolean(token) && (await sha256(token)) === ADMIN_HASH
}

function bytesToBase64(value: Uint8Array) {
  let binary = ''
  for (let i = 0; i < value.length; i += 1) binary += String.fromCharCode(value[i])
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function deriveEncryptionKey(adminToken: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(adminToken),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210_000 },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptSecret(value: string, adminToken: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveEncryptionKey(adminToken, salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value),
  )
  return {
    encryptedApiKey: bytesToBase64(new Uint8Array(encrypted)),
    encryptionIv: bytesToBase64(iv),
    encryptionSalt: bytesToBase64(salt),
  }
}

async function decryptSecret(row: any, adminToken: string) {
  const salt = base64ToBytes(row.encryption_salt)
  const iv = base64ToBytes(row.encryption_iv)
  const key = await deriveEncryptionKey(adminToken, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBytes(row.encrypted_api_key),
  )
  return new TextDecoder().decode(decrypted)
}

function safeModel(value: unknown) {
  const model = String(value || DEFAULT_MODEL).trim()
  return /^[a-z0-9._-]{3,80}$/i.test(model) ? model : DEFAULT_MODEL
}

async function readSettings() {
  const { data, error } = await sb
    .from('portfolio_ai_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .maybeSingle()
  if (error) throw error
  return data
}

function publicSettings(row: any) {
  return {
    provider: 'google-gemini',
    providerLabel: 'Google Gemini',
    model: row?.model || DEFAULT_MODEL,
    hasApiKey: Boolean(row?.encrypted_api_key),
    maskedKey: row?.key_last_four ? `••••••••••••${row.key_last_four}` : '',
    verifiedAt: row?.verified_at || null,
    updatedAt: row?.updated_at || null,
    freeTier: true,
  }
}

async function validateGeminiKey(apiKey: string) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
    headers: { 'x-goog-api-key': apiKey },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini rejected the API key (HTTP ${response.status}).`)
  }
  return true
}

function decodeXml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function capText(value: string, limit = MAX_EXTRACTED_CHARS_PER_FILE) {
  if (value.length <= limit) return value
  return `${value.slice(0, limit)}\n[Content truncated after ${limit.toLocaleString()} characters for analysis.]`
}

function extractOfficeText(bytes: Uint8Array, extension: string) {
  const archive = unzipSync(bytes)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const candidates = Object.entries(archive)
    .filter(([name]) => {
      if (extension === 'docx') return /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/i.test(name)
      if (extension === 'xlsx') return /^(xl\/(sharedStrings|workbook)\.xml|xl\/worksheets\/sheet\d+\.xml)$/i.test(name)
      return /^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/i.test(name)
    })
    .slice(0, 80)
  return capText(candidates.map(([name, data]) => `\n[${name}]\n${decodeXml(decoder.decode(data))}`).join('\n'))
}

function extractZipText(bytes: Uint8Array) {
  const archive = unzipSync(bytes)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const entries = Object.entries(archive)
    .filter(([name, data]) => data.length <= 2_000_000 && /\.(txt|md|csv|json|sql|py|js|jsx|ts|tsx|xml|html|css)$/i.test(name))
    .slice(0, 35)
  if (!entries.length) return `Archive entries: ${Object.keys(archive).slice(0, 100).join(', ')}`
  return capText(entries.map(([name, data]) => `\n[${name}]\n${decoder.decode(data)}`).join('\n'))
}

function extensionOf(name = '') {
  return name.toLowerCase().split('.').pop() || ''
}

async function uploadGeminiFile(apiKey: string, blob: Blob, displayName: string, mimeType: string) {
  const start = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(blob.size),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName.slice(0, 120) } }),
  })
  if (!start.ok) {
    const detail = await start.json().catch(() => ({}))
    throw new Error(detail?.error?.message || `Gemini file upload could not start (HTTP ${start.status}).`)
  }
  const uploadUrl = start.headers.get('x-goog-upload-url')
  if (!uploadUrl) throw new Error('Gemini did not return a file upload URL.')

  const finish = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
      'Content-Type': mimeType,
    },
    body: blob,
  })
  const payload = await finish.json().catch(() => ({}))
  if (!finish.ok || !payload?.file?.uri) {
    throw new Error(payload?.error?.message || `Gemini file upload failed (HTTP ${finish.status}).`)
  }

  let file = payload.file
  for (let attempt = 0; attempt < 12 && file?.state === 'PROCESSING'; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 850))
    const stateResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}`, {
      headers: { 'x-goog-api-key': apiKey },
    })
    if (stateResponse.ok) file = await stateResponse.json()
  }
  if (file?.state === 'FAILED') throw new Error(`${displayName} could not be processed by Gemini.`)
  return file
}

async function deleteGeminiFile(apiKey: string, name: string) {
  if (!name) return
  await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}`, {
    method: 'DELETE',
    headers: { 'x-goog-api-key': apiKey },
  }).catch(() => {})
}

const projectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Concise professional project title.' },
    category: {
      type: 'string',
      enum: ['Private Equity', 'Investment Banking / M&A', 'Special Situations / Distressed', 'Hedge Fund', 'Private Credit', 'Growth Equity'],
    },
    industry: { type: 'string' },
    year: { type: 'integer', minimum: 2000, maximum: 2100 },
    impact: { type: 'string', description: 'One evidence-based outcome or deliverable line. Do not invent transaction results.' },
    executiveSummary: { type: 'string' },
    problem: { type: 'string' },
    metrics: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: { k: { type: 'string' }, v: { type: 'string' } },
        required: ['k', 'v'],
      },
    },
    approach: { type: 'array', maxItems: 8, items: { type: 'string' } },
    deliverables: { type: 'array', maxItems: 10, items: { type: 'string' } },
    tools: { type: 'array', maxItems: 12, items: { type: 'string' } },
    tags: { type: 'array', maxItems: 12, items: { type: 'string' } },
    learnings: { type: 'string' },
    readingMinutes: { type: 'integer', minimum: 2, maximum: 20 },
    evidence: {
      type: 'array',
      maxItems: 15,
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          source: { type: 'string' },
          finding: { type: 'string' },
        },
        required: ['field', 'source', 'finding'],
      },
    },
    analysisNotes: { type: 'array', maxItems: 12, items: { type: 'string' } },
  },
  required: [
    'title', 'category', 'industry', 'year', 'impact', 'executiveSummary', 'problem',
    'metrics', 'approach', 'deliverables', 'tools', 'tags', 'learnings',
    'readingMinutes', 'evidence', 'analysisNotes',
  ],
}

function analysisPrompt(fileNames: string[]) {
  return `You are preparing one recruiter-facing institutional finance portfolio project from the attached source files.

Read every supplied file as a single project package. Extract facts, project scope, methodology, outputs, company/sector context, tools, and defensible quantitative highlights. Never invent a deal outcome, valuation, return, employer claim, or metric. If a fact is unavailable, omit it or state that it was not evidenced. Prefer exact numbers only when the source supports them.

Write in polished first-person-neutral portfolio language: credible, concise, human, and suitable for investment banking, private equity, private credit, hedge fund, growth equity, or distressed recruiters. The public summary must describe work actually evidenced by the files, not a template aspiration.

For evidence, name the source filename and the finding that supports each important field. Add analysisNotes for limitations, unsupported legacy formats, truncated material, or conflicts across files.

Source filenames: ${fileNames.join(', ')}`
}

async function analyzeFiles(req: Request, body: any) {
  const adminToken = req.headers.get('x-admin-token') || ''
  const settings = await readSettings()
  if (!settings?.encrypted_api_key) throw new Error('Add and verify a Gemini API key first.')
  const apiKey = await decryptSecret(settings, adminToken)
  const model = safeModel(settings.model)
  const fileIds = [...new Set((Array.isArray(body?.fileIds) ? body.fileIds : []).map((id: unknown) => String(id)).filter(Boolean))].slice(0, MAX_FILES)
  if (!fileIds.length) throw new Error('Upload at least one project file before analysis.')

  const { data: unorderedRows, error } = await sb
    .from('portfolio_files')
    .select('id,original_name,label,mime_type,size_bytes,category,storage_key,project_id,status')
    .in('id', fileIds)
    .eq('status', 'ready')
  if (error) throw error
  const byId = new Map((unorderedRows || []).map((row: any) => [row.id, row]))
  const rows = fileIds.map((id) => byId.get(id)).filter(Boolean)
  if (rows.length !== fileIds.length) throw new Error('One or more selected files are missing or not ready.')

  const suppliedDraftId = String(body?.draftId || '')
  if (suppliedDraftId && rows.some((row: any) => row.project_id && row.project_id !== suppliedDraftId)) {
    throw new Error('A selected file belongs to a different project draft.')
  }

  const textParts: string[] = []
  const geminiFiles: any[] = []
  const automaticNotes: string[] = []
  let extractedChars = 0

  try {
    for (const row of rows as any[]) {
      const { data: blob, error: downloadError } = await sb.storage.from('portfolio-files').download(row.storage_key)
      if (downloadError || !blob) throw new Error(`Could not read ${row.original_name}: ${downloadError?.message || 'download failed'}`)
      const extension = extensionOf(row.original_name)
      const mime = row.mime_type || blob.type || 'application/octet-stream'
      const isText = mime.startsWith('text/') || ['csv', 'markdown', 'python', 'sql'].includes(row.category) || ['txt', 'md', 'csv', 'json', 'sql', 'py', 'js', 'jsx', 'ts', 'tsx'].includes(extension)

      if (isText) {
        let value = capText(await blob.text())
        const remaining = MAX_EXTRACTED_CHARS_TOTAL - extractedChars
        if (remaining <= 0) {
          automaticNotes.push(`${row.original_name}: text omitted after the combined extraction limit was reached.`)
          continue
        }
        value = value.slice(0, remaining)
        extractedChars += value.length
        textParts.push(`\n===== ${row.original_name} =====\n${value}`)
        continue
      }

      if (['docx', 'xlsx', 'pptx'].includes(extension)) {
        try {
          let value = extractOfficeText(new Uint8Array(await blob.arrayBuffer()), extension)
          const remaining = MAX_EXTRACTED_CHARS_TOTAL - extractedChars
          value = value.slice(0, Math.max(0, remaining))
          extractedChars += value.length
          textParts.push(`\n===== Extracted from ${row.original_name} =====\n${value}`)
        } catch (officeError) {
          automaticNotes.push(`${row.original_name}: Office XML extraction failed (${String((officeError as any)?.message || officeError)}).`)
        }
        continue
      }

      if (extension === 'zip') {
        try {
          let value = extractZipText(new Uint8Array(await blob.arrayBuffer()))
          const remaining = MAX_EXTRACTED_CHARS_TOTAL - extractedChars
          value = value.slice(0, Math.max(0, remaining))
          extractedChars += value.length
          textParts.push(`\n===== Extracted from archive ${row.original_name} =====\n${value}`)
        } catch (zipError) {
          automaticNotes.push(`${row.original_name}: archive extraction failed (${String((zipError as any)?.message || zipError)}).`)
        }
        continue
      }

      const geminiSupported = row.category === 'pdf' || row.category === 'image' || mime.startsWith('video/') || mime.startsWith('audio/')
      if (geminiSupported) {
        const uploaded = await uploadGeminiFile(apiKey, blob, row.original_name, mime)
        geminiFiles.push(uploaded)
        continue
      }

      automaticNotes.push(`${row.original_name}: legacy or unsupported binary format; filename and metadata were available but contents were not extracted.`)
    }

    const prompt = analysisPrompt(rows.map((row: any) => row.original_name))
    const parts: any[] = [{ text: prompt }]
    if (textParts.length) parts.push({ text: textParts.join('\n').slice(0, MAX_EXTRACTED_CHARS_TOTAL) })
    geminiFiles.forEach((file) => parts.push({ fileData: { mimeType: file.mimeType, fileUri: file.uri } }))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: projectSchema,
          maxOutputTokens: 8192,
        },
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload?.error?.message || `Gemini analysis failed (HTTP ${response.status}).`)
    const raw = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || ''
    if (!raw) throw new Error('Gemini returned no project analysis.')
    const analysis = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''))
    analysis.analysisNotes = [...new Set([...(analysis.analysisNotes || []), ...automaticNotes])]
    return {
      analysis,
      model,
      provider: 'google-gemini',
      filesAnalyzed: rows.length,
      usage: payload?.usageMetadata || null,
    }
  } finally {
    await Promise.allSettled(geminiFiles.map((file) => deleteGeminiFile(apiKey, file.name)))
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!(await isAdmin(req))) return json({ error: 'unauthorized' }, 401)

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/project-ai-api')[1] || '/'
    const method = req.method.toUpperCase()
    const adminToken = req.headers.get('x-admin-token') || ''

    if (path === '/settings' && method === 'GET') return json(publicSettings(await readSettings()))

    if (path === '/settings' && method === 'PUT') {
      const body = await req.json().catch(() => ({}))
      const current = await readSettings()
      const apiKey = String(body?.apiKey || '').trim()
      const model = safeModel(body?.model || current?.model)
      if (!apiKey && !current?.encrypted_api_key) return json({ error: 'Gemini API key is required.' }, 400)

      let encrypted = current ? {
        encryptedApiKey: current.encrypted_api_key,
        encryptionIv: current.encryption_iv,
        encryptionSalt: current.encryption_salt,
      } : null
      let keyLastFour = current?.key_last_four || ''
      let keyToVerify = apiKey
      if (apiKey) {
        await validateGeminiKey(apiKey)
        encrypted = await encryptSecret(apiKey, adminToken)
        keyLastFour = apiKey.slice(-4)
      } else {
        keyToVerify = await decryptSecret(current, adminToken)
        await validateGeminiKey(keyToVerify)
      }

      const now = new Date().toISOString()
      const { error } = await sb.from('portfolio_ai_settings').upsert({
        id: SETTINGS_ID,
        provider: 'google-gemini',
        model,
        encrypted_api_key: encrypted?.encryptedApiKey,
        encryption_iv: encrypted?.encryptionIv,
        encryption_salt: encrypted?.encryptionSalt,
        key_last_four: keyLastFour,
        verified_at: now,
        updated_at: now,
      }, { onConflict: 'id' })
      if (error) throw error
      return json({ ok: true, settings: publicSettings(await readSettings()) })
    }

    if (path === '/test' && method === 'POST') {
      const settings = await readSettings()
      if (!settings?.encrypted_api_key) return json({ error: 'No Gemini API key is saved.' }, 400)
      await validateGeminiKey(await decryptSecret(settings, adminToken))
      return json({ ok: true, model: settings.model || DEFAULT_MODEL, message: 'Gemini connection verified.' })
    }

    if (path === '/settings' && method === 'DELETE') {
      const { error } = await sb.from('portfolio_ai_settings').delete().eq('id', SETTINGS_ID)
      if (error) throw error
      return json({ ok: true })
    }

    if (path === '/analyze' && method === 'POST') {
      return json(await analyzeFiles(req, await req.json().catch(() => ({}))))
    }

    return json({ error: 'not found' }, 404)
  } catch (error) {
    console.error(error)
    return json({ error: 'AI project service error', detail: String((error as any)?.message || error) }, 500)
  }
})
