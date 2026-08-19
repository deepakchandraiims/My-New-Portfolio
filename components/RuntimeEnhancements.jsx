'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import RecruiterBody from '@/components/RecruiterBody'

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

  // Public body is part of the initial render path. It ships with seed content
  // immediately, then hydrates from the CMS and live portfolio APIs without
  // first painting the legacy long page.
  return <RecruiterBody />
}
