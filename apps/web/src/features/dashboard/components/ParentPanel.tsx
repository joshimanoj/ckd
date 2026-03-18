import { useEffect, useState } from 'react'
import type { Firestore } from 'firebase/firestore'
import { useAuth } from '../../auth/hooks/useAuth'
import { SettingsScreen } from '../../notifications/components/SettingsScreen'
import { DashboardScreen } from './DashboardScreen'

interface ParentPanelProps {
  db: Firestore
  uid: string
  childProfileId: string
  onClose: () => void
}

type Tab = 'dashboard' | 'settings'

export function ParentPanel({ db, uid, childProfileId, onClose }: ParentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const { signOut } = useAuth()

  useEffect(() => {
    const scrollY = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

  return (
    <>
      <div data-testid="panel-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} onClick={onClose} />

      <div data-testid="parent-panel" className="ckd-panel-shell" onClick={(e) => e.stopPropagation()}>
        <header className="ckd-dashboard-header">
          <div className="ckd-blob" style={{ width: 150, height: 150, top: -20, right: -30, opacity: 0.15 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <button data-testid="panel-close-btn" className="ckd-back-button" onClick={onClose}>
              ←
            </button>
            <p className="ckd-screen-title" style={{ fontSize: 18, fontWeight: 700 }}>
              {activeTab === 'dashboard' ? 'Parent Dashboard' : 'Settings'}
            </p>
          </div>
        </header>

        <div style={{ padding: '16px 16px 0', background: '#FFFFFF' }}>
          <div className="ckd-tab-strip">
            <button className={`ckd-tab ${activeTab === 'dashboard' ? 'ckd-tab--active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              📊 Dashboard
            </button>
            <button className={`ckd-tab ${activeTab === 'settings' ? 'ckd-tab--active' : ''}`} onClick={() => setActiveTab('settings')}>
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#FAFAFA' }}>
          {activeTab === 'dashboard' ? (
            <DashboardScreen db={db} uid={uid} childProfileId={childProfileId} />
          ) : (
            <SettingsScreen uid={uid} onSignOut={signOut} />
          )}
        </div>
      </div>
    </>
  )
}
