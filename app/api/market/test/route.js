import { proxyPortfolioRequest } from '@/lib/portfolio-supabase-proxy'

export const runtime = 'nodejs'

export async function POST(request) {
  return proxyPortfolioRequest(request, '/market/test')
}
