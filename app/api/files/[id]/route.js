import { proxyFilesRequest } from '@/lib/files-supabase-proxy'

export const runtime = 'nodejs'

export async function DELETE(request, { params }) {
  const { id } = await params
  return proxyFilesRequest(request, `/files/${encodeURIComponent(id)}`)
}

export async function PATCH(request, { params }) {
  const { id } = await params
  return proxyFilesRequest(request, `/files/${encodeURIComponent(id)}`)
}
