import { proxyFilesRequest } from '@/lib/files-supabase-proxy'

export const runtime = 'nodejs'

export async function GET(request) {
  return proxyFilesRequest(request, '/files')
}
