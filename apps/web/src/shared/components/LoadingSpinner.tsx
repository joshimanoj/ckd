export function LoadingSpinner() {
  return (
    <div
      data-testid="loading-spinner"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)' }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  )
}
