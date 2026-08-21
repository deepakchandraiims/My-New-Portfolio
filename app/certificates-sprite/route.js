import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function GET(request) {
  const file = path.join(process.cwd(), 'public', 'certificates', 'certificates-sprite.webp.b64')
  const base64 = fs.readFileSync(file, 'utf8').trim()
  const source = Buffer.from(base64, 'base64')

  const { searchParams } = new URL(request.url)
  const rawIndex = searchParams.get('index')

  if (rawIndex === null) {
    return new Response(source, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  const index = Math.min(14, Math.max(0, Number.parseInt(rawIndex, 10) || 0))
  const image = sharp(source)
  const meta = await image.metadata()
  if (!meta.width || !meta.height) return new Response('Invalid sprite', { status: 500 })

  const count = 15
  const tileHeight = Math.floor(meta.height / count)
  const top = index * tileHeight
  const height = index === count - 1 ? meta.height - top : tileHeight

  const body = await sharp(source)
    .extract({ left: 0, top, width: meta.width, height })
    .webp({ quality: 92 })
    .toBuffer()

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="certificate-${index + 1}.webp"`,
    },
  })
}
