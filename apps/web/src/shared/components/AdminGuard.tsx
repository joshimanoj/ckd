import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { auth } from '@ckd/shared/firebase/config'
import { LoadingSpinner } from './LoadingSpinner'

type AdminStatus = 'loading' | 'admin' | 'denied'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AdminStatus>('loading')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('denied')
        return
      }
      try {
        const result = await getIdTokenResult(user, true)
        setStatus(result.claims['admin'] === true ? 'admin' : 'denied')
      } catch {
        setStatus('denied')
      }
    })
    return unsub
  }, [])

  if (status === 'loading') return <LoadingSpinner />
  if (status === 'denied') return <Navigate to="/" replace />
  return <>{children}</>
}
