import { useEffect, useState } from 'react'
import type { Firestore } from 'firebase/firestore'
import { DashboardScreen } from './DashboardScreen'
import { SettingsScreen } from '../../notifications/components/SettingsScreen'

interface ParentPanelProps {
  db: Firestore
  uid: string
  childProfileId: string
  onClose: () => void
}

type Tab = 'dashboard' | 'settings'

export function ParentPanel({ db, uid, childProfileId, onClose }: ParentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    flex: 1,
    padding: '8px 0',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 8,
    transition: 'all 150ms ease',
    background: activeTab === tab ? 'white' : 'transparent',
    color: activeTab === tab ? '#7C3AED' : '#9CA3AF',
    boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
  })

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
        }}
      />

      {/* Drawer */}
      <div
        data-testid="parent-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(320px, 100vw)',
          background: '#FAFAFA',
          borderRadius: '24px 0 0 24px',
          zIndex: 201,
          overflowY: 'auto',
          animation: 'slide-in-right 250ms ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 32, height: 4, background: '#D1D5DB', borderRadius: 2 }} />
        </div>

        {/* Close button */}
        <button
          data-testid="panel-close-btn"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            width: 36,
            height: 36,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Panel title */}
        <p style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: '#1E1B4B',
          margin: '4px 16px 0',
        }}>
          Parent Panel
        </p>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          margin: '12px 16px 0',
          background: '#F3E8FF',
          borderRadius: 10,
          padding: 3,
          gap: 2,
        }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </button>
          <button style={tabStyle('settings')} onClick={() => setActiveTab('settings')}>
            ⚙️ Settings
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'dashboard'
          ? <DashboardScreen db={db} uid={uid} childProfileId={childProfileId} />
          : <SettingsScreen uid={uid} />
        }
      </div>
    </>
  )
}
