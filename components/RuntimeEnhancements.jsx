'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const PortfolioReferenceSections = dynamic(() => import('@/components/PortfolioReferenceSections'), { ssr: false })
const DirectSupabaseUploadBridge = dynamic(() => import('@/components/DirectSupabaseUploadBridge'), { ssr: false })
const AdminWorkflowEnhancements = dynamic(() => import('@/components/AdminWorkflowEnhancements'), { ssr: false })

export default function RuntimeEnhancements() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return (
      <>
        <DirectSupabaseUploadBridge />
        <AdminWorkflowEnhancements />
      </>
    )
  }

  // The public homepage body is replaced by the compact recruiter layout.
  // It fetches the same CMS, Supabase portfolio and project-file APIs itself,
  // so the older DOM enhancement bundles are intentionally not loaded here.
  return <PortfolioReferenceSections />
}
