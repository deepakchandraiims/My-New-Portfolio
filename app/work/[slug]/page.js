import FinanceWorkRoom from '@/components/FinanceWorkRoom'
import { FINANCE_ROOMS } from '@/lib/finance-site-map'

export function generateStaticParams() {
  return FINANCE_ROOMS.map((room) => ({ slug: room.slug }))
}

export default async function FinanceWorkPage({ params }) {
  const { slug } = await params
  return <FinanceWorkRoom slug={slug} />
}
