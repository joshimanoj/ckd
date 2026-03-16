export function LoadingSpinner() {
  return (
    <div
      data-testid="loading-spinner"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(147, 51, 234, 0.2)',
          borderTopColor: '#9333EA',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  )
}
