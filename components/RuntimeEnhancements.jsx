'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import AdminSectionSync from '@/components/AdminSectionSync'

const DirectSupabaseUploadBridge = dynamic(() => import('@/components/DirectSupabaseUploadBridge'), { ssr: false })
const AdminWorkflowEnhancements = dynamic(() => import('@/components/AdminWorkflowEnhancements'), { ssr: false })
const CertificationFileAdminEnhancer = dynamic(() => import('@/components/CertificationFileAdminEnhancer'), { ssr: false })
const CertificateUploadDrawer = dynamic(() => import('@/components/CertificateUploadDrawer'), { ssr: false })
const AdminProjectVisibility = dynamic(() => import('@/components/AdminProjectVisibility'), { ssr: false })
const AdminProjectFileManager = dynamic(() => import('@/components/AdminProjectFileManager'), { ssr: false })
const PortfolioEnhancements = dynamic(() => import('@/components/PortfolioEnhancements'), { ssr: false })
const MarketEnhancements = dynamic(() => import('@/components/MarketEnhancements'), { ssr: false })

export default function RuntimeEnhancements() {
  const pathname = usePathname()
  if (!pathname?.startsWith('/admin')) return null

  return (
    <>
      <AdminSectionSync />
      <DirectSupabaseUploadBridge />
      <AdminWorkflowEnhancements />
      <CertificationFileAdminEnhancer />
      <CertificateUploadDrawer />
      <AdminProjectVisibility />
      <AdminProjectFileManager />
      <PortfolioEnhancements />
      <MarketEnhancements />
    </>
  )
}
