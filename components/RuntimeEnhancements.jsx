'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import RecruiterBody from '@/components/RecruiterBody'
import InvestmentLabEnhancement from '@/components/InvestmentLabEnhancement'

const DirectSupabaseUploadBridge = dynamic(() => import('@/components/DirectSupabaseUploadBridge'), { ssr: false })
const AdminWorkflowEnhancements = dynamic(() => import('@/components/AdminWorkflowEnhancements'), { ssr: false })
const PortfolioEnhancements = dynamic(() => import('@/components/PortfolioEnhancements'), { ssr: false })
const MarketEnhancements = dynamic(() => import('@/components/MarketEnhancements'), { ssr: false })

export default function RuntimeEnhancements() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return (
      <>
        <DirectSupabaseUploadBridge />
        <AdminWorkflowEnhancements />
        <PortfolioEnhancements />
        <MarketEnhancements />
      </>
    )
  }

  return (
    <>
      <RecruiterBody />
      <InvestmentLabEnhancement />
    </>
  )
}
