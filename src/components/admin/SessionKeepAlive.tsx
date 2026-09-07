'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Refresh 5 minutes before token expires to avoid a mid-session 401
const REFRESH_BEFORE_S = 5 * 60

function getExpiryFromCookie(): number | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)token-expiry=([^;]+)/)
  return match ? parseInt(match[1], 10) : null
}

export function SessionKeepAlive() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function doRefresh() {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
        if (res.ok) {
          scheduleNext()
          router.refresh()
        } else {
          router.push('/login')
        }
      } catch {
        // Network hiccup — retry in 60s rather than dropping the session
        timerRef.current = setTimeout(doRefresh, 60_000)
      }
    }

    function scheduleNext() {
      const expiry = getExpiryFromCookie()
      if (!expiry) return

      const delayS = expiry - Math.floor(Date.now() / 1000) - REFRESH_BEFORE_S
      timerRef.current = setTimeout(doRefresh, Math.max(delayS, 0) * 1000)
    }

    scheduleNext()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router])

  return null
}
