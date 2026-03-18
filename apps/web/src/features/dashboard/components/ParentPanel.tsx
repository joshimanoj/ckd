import { useEffect, useState } from 'react'
import type { Firestore } from 'firebase/firestore'
import { DashboardScreen } from './DashboardScreen'
import { SettingsScreen } from '../../notifications/components/SettingsScreen'
import { useAuth } from '../../auth/hooks/useAuth'

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

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    flex: 1,
    minHeight: 52,
    padding: '10px 10px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    borderRadius: 17,
    transition: 'all 150ms ease',
    background: activeTab === tab ? 'white' : 'transparent',
    color: activeTab === tab ? '#9333EA' : '#6B7280',
    boxShadow: activeTab === tab ? '0 14px 30px rgba(147, 51, 234, 0.14)' : 'none',
  })

  const tabTitle = activeTab === 'dashboard' ? 'Parent Dashboard' : 'Settings'

  return (
    <>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%) }
          to   { transform: translateX(0) }
        }
      `}</style>

      {/* Overlay */}
      <div
        data-testid="panel-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
          overscrollBehavior: 'none',
        }}
      />

      {/* Drawer */}
      <div
        data-testid="parent-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          maxWidth: '100vw',
          height: '100dvh',
          minHeight: '100dvh',
          background: '#FFFFFF',
          borderRadius: 0,
          zIndex: 201,
          overflow: 'hidden',
          overscrollBehavior: 'none',
          touchAction: 'none',
          animation: 'slide-in-right 250ms ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Gradient header */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #CC5AAA 0%, #9333EA 48%, #EC4899 100%)',
            borderRadius: 0,
            padding: '12px 20px 6px',
            flexShrink: 0,
            minHeight: 94,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -36,
              left: -34,
              width: 128,
              height: 128,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.14)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 18,
              right: 20,
              display: 'flex',
              gap: 6,
            }}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'block',
                }}
              />
            ))}
          </div>
          {/* Back / close button + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, marginBottom: 0, position: 'relative' }}>
            <button
              data-testid="panel-close-btn"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 21,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              ←
            </button>
            <p style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: '#fff',
              margin: 0,
              letterSpacing: '0.01em',
            }}>
              {tabTitle}
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF7FE 52%, #FFFFFF 100%)',
            flexShrink: 0,
            padding: '10px 20px 0',
          }}
        >
          <div style={{
            display: 'flex',
            background: '#F3E8FF',
            borderRadius: 18,
            padding: 6,
            gap: 6,
            position: 'relative',
            boxShadow: '0 12px 28px rgba(147, 51, 234, 0.08)',
          }}>
            <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
              📊 Dashboard
            </button>
            <button style={tabStyle('settings')} onClick={() => setActiveTab('settings')}>
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF7FE 52%, #FFFFFF 100%)',
            overflowY: 'auto',
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {activeTab === 'dashboard'
            ? <DashboardScreen db={db} uid={uid} childProfileId={childProfileId} />
            : <SettingsScreen uid={uid} onSignOut={signOut} />
          }
        </div>
      </div>
    </>
  )
}
