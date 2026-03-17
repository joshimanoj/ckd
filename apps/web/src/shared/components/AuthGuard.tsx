import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

const routeMap: Record<string, string> = {
  'sign-in': '/',
  consent: '/consent',
  profile: '/profile',
  library: '/library',
}

// Paths that are only valid before full auth — redirect away from these when authenticated
const AUTH_GATE_PATHS = new Set(['/', '/consent', '/profile'])

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, routeTo } = useAuth()

  if (loading) return <LoadingSpinner />

  const targetPath = routeMap[routeTo] ?? '/'
  const currentPath = window.location.pathname

  // Fully authenticated: allow any app route except auth-gate paths
  if (routeTo === 'library') {
    if (AUTH_GATE_PATHS.has(currentPath)) {
      return <Navigate to="/library" replace />
    }
    return <>{children}</>
  }

  if (targetPath !== currentPath) {
    return <Navigate to={targetPath} replace />
  }

  return <>{children}</>
}
