import { proxyPortfolioRequest } from '@/lib/portfolio-supabase-proxy'

export const runtime = 'nodejs'

export async function GET(request) {
  return proxyPortfolioRequest(request, '/market/config')
}

export async function PUT(request) {
  return proxyPortfolioRequest(request, '/market/config')
}
