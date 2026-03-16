import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

const routeMap: Record<string, string> = {
  'sign-in': '/',
  consent: '/consent',
  profile: '/profile',
  library: '/library',
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, routeTo } = useAuth()

  if (loading) return <LoadingSpinner />

  const targetPath = routeMap[routeTo] ?? '/'
  const currentPath = window.location.pathname

  if (targetPath !== currentPath) {
    return <Navigate to={targetPath} replace />
  }

  return <>{children}</>
}
