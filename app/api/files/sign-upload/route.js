import { proxyFilesRequest } from '@/lib/files-supabase-proxy'

export const runtime = 'nodejs'

export async function POST(request) {
  return proxyFilesRequest(request, '/files/sign-upload')
}
