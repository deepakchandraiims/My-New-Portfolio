'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mnppdqrhnpllzafufhtd.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0F_6IPrIRxn58J8y0OaAbQ_Dtf8VSa1'
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function setReadonly(instance, key, value) {
  try {
    Object.defineProperty(instance, key, { configurable: true, value })
  } catch {
    // Ignore if the browser does not allow redefining a native property.
  }
}

function emitProgress(xhr, percent) {
  try {
    const event = new ProgressEvent('progress', {
      lengthComputable: true,
      loaded: percent,
      total: 100,
    })
    xhr.upload?.onprogress?.(event)
  } catch {
    // Progress is cosmetic; upload can continue if the event cannot be emitted.
  }
}

export default function DirectSupabaseUploadBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (window.__portfolioDirectUploadInstalled) return undefined

    const NativeXHR = window.XMLHttpRequest
    window.__portfolioDirectUploadInstalled = true

    function PatchedXMLHttpRequest() {
      const xhr = new NativeXHR()
      const nativeOpen = xhr.open.bind(xhr)
      const nativeSend = xhr.send.bind(xhr)
      const nativeSetRequestHeader = xhr.setRequestHeader.bind(xhr)
      const nativeAbort = xhr.abort.bind(xhr)

      let intercept = false
      let aborted = false
      const requestHeaders = {}

      xhr.open = function open(method, url, ...rest) {
        const urlText = String(url || '')
        intercept = String(method || '').toUpperCase() === 'POST' &&
          (urlText === '/api/files/upload' || urlText.endsWith('/api/files/upload'))

        if (!intercept) return nativeOpen(method, url, ...rest)
        setReadonly(xhr, 'readyState', 1)
      }

      xhr.setRequestHeader = function setRequestHeader(name, value) {
        if (!intercept) return nativeSetRequestHeader(name, value)
        requestHeaders[String(name).toLowerCase()] = String(value)
      }

      xhr.abort = function abort() {
        if (!intercept) return nativeAbort()
        aborted = true
      }

      xhr.send = function send(body) {
        if (!intercept) return nativeSend(body)

        void (async () => {
          let uploadId = ''
          try {
            if (!(body instanceof FormData)) throw new Error('Invalid upload payload.')
            const file = body.get('file')
            if (!(file instanceof File)) throw new Error('No file selected.')

            const adminToken = requestHeaders['x-admin-token'] || localStorage.getItem('portfolio_admin_token') || ''
            if (!adminToken) throw new Error('Admin session expired. Please sign in again.')

            emitProgress(xhr, 5)

            const signResponse = await fetch('/api/files/sign-upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken,
              },
              body: JSON.stringify({
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size,
                projectId: body.get('projectId') || null,
                projectTitle: body.get('projectTitle') || null,
                label: body.get('label') || file.name,
              }),
            })

            const signed = await signResponse.json().catch(() => ({}))
            if (!signResponse.ok) throw new Error(signed.detail || signed.error || `HTTP ${signResponse.status}`)
            uploadId = signed.id || ''
            if (aborted) throw new Error('Upload cancelled.')

            emitProgress(xhr, 20)

            const { error: uploadError } = await supabase.storage
              .from(signed.bucket)
              .uploadToSignedUrl(signed.path, signed.token, file, {
                contentType: file.type || 'application/octet-stream',
                cacheControl: '3600',
                upsert: false,
              })

            if (uploadError) throw uploadError
            if (aborted) throw new Error('Upload cancelled.')

            emitProgress(xhr, 85)

            const finalizeResponse = await fetch('/api/files/finalize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken,
              },
              body: JSON.stringify({ id: uploadId }),
            })
            const finalized = await finalizeResponse.json().catch(() => ({}))
            if (!finalizeResponse.ok) throw new Error(finalized.detail || finalized.error || `HTTP ${finalizeResponse.status}`)

            emitProgress(xhr, 100)
            setReadonly(xhr, 'status', 201)
            setReadonly(xhr, 'statusText', 'Created')
            setReadonly(xhr, 'responseText', JSON.stringify(finalized))
            setReadonly(xhr, 'response', JSON.stringify(finalized))
            setReadonly(xhr, 'readyState', 4)
            queueMicrotask(() => xhr.onload?.(new Event('load')))
          } catch (error) {
            if (uploadId) {
              const adminToken = requestHeaders['x-admin-token'] || localStorage.getItem('portfolio_admin_token') || ''
              fetch(`/api/files/${encodeURIComponent(uploadId)}`, {
                method: 'DELETE',
                headers: adminToken ? { 'x-admin-token': adminToken } : {},
              }).catch(() => {})
            }

            const message = String(error?.message || error || 'Upload failed')
            setReadonly(xhr, 'status', 500)
            setReadonly(xhr, 'statusText', 'Upload Failed')
            setReadonly(xhr, 'responseText', JSON.stringify({ error: message }))
            setReadonly(xhr, 'response', JSON.stringify({ error: message }))
            setReadonly(xhr, 'readyState', 4)
            queueMicrotask(() => xhr.onload?.(new Event('load')))
          }
        })()
      }

      return xhr
    }

    PatchedXMLHttpRequest.prototype = NativeXHR.prototype
    window.XMLHttpRequest = PatchedXMLHttpRequest

    return () => {
      window.XMLHttpRequest = NativeXHR
      window.__portfolioDirectUploadInstalled = false
    }
  }, [])

  return null
}
