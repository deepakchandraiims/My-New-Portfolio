import { proxyPortfolioRequest } from '@/lib/portfolio-supabase-proxy'

export const runtime = 'nodejs'

export async function GET(request) {
  return proxyPortfolioRequest(request, '/live')
}
