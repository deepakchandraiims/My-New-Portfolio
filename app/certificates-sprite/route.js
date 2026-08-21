import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

export async function GET() {
  const file = path.join(process.cwd(), 'public', 'certificates', 'certificates-sprite.webp.b64')
  const base64 = fs.readFileSync(file, 'utf8').trim()
  const body = Buffer.from(base64, 'base64')
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
