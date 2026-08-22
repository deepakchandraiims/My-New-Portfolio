'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import RecruiterBody from '@/components/RecruiterBody'
import ProjectCatalogEnhancer from '@/components/ProjectCatalogEnhancer'
import InvestmentLabEnhancement from '@/components/InvestmentLabEnhancement'
import CertificateGallery from '@/components/CertificateGallery'
import CertificateDocumentEnhancer from '@/components/CertificateDocumentEnhancer'

const DirectSupabaseUploadBridge = dynamic(() => import('@/components/DirectSupabaseUploadBridge'), { ssr: false })
const AdminWorkflowEnhancements = dynamic(() => import('@/components/AdminWorkflowEnhancements'), { ssr: false })
const CertificationFileAdminEnhancer = dynamic(() => import('@/components/CertificationFileAdminEnhancer'), { ssr: false })
const CertificateUploadDrawer = dynamic(() => import('@/components/CertificateUploadDrawer'), { ssr: false })
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
        <CertificationFileAdminEnhancer />
        <CertificateUploadDrawer />
        <PortfolioEnhancements />
        <MarketEnhancements />
      </>
    )
  }

  return (
    <>
      <RecruiterBody />
      <ProjectCatalogEnhancer />
      <InvestmentLabEnhancement />
      <CertificateGallery />
      <CertificateDocumentEnhancer />
    </>
  )
}
