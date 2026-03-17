import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationOptInSheet } from '../NotificationOptInSheet'

describe('NotificationOptInSheet', () => {
  it('should not render when visible is false', () => {
    render(
      <NotificationOptInSheet
        visible={false}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('notif-optin-sheet')).not.toBeInTheDocument()
  })

  it('should render when visible is true', () => {
    render(
      <NotificationOptInSheet
        visible={true}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.getByTestId('notif-optin-sheet')).toBeInTheDocument()
    expect(screen.getByTestId('notif-accept-btn')).toBeInTheDocument()
    expect(screen.getByTestId('notif-dismiss-btn')).toBeInTheDocument()
  })

  it('should call onDismiss when "Not now" is clicked', async () => {
    const onDismiss = vi.fn()
    render(
      <NotificationOptInSheet
        visible={true}
        onAccept={vi.fn()}
        onDismiss={onDismiss}
      />,
    )
    await userEvent.click(screen.getByTestId('notif-dismiss-btn'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should call onAccept when "Yes, notify me" is clicked', async () => {
    const onAccept = vi.fn().mockResolvedValue(undefined)
    render(
      <NotificationOptInSheet
        visible={true}
        onAccept={onAccept}
        onDismiss={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByTestId('notif-accept-btn'))
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('should show loading state while onAccept is in progress', async () => {
    let resolve!: () => void
    const onAccept = vi.fn(
      () => new Promise<void>((r) => { resolve = r }),
    )
    render(
      <NotificationOptInSheet
        visible={true}
        onAccept={onAccept}
        onDismiss={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByTestId('notif-accept-btn'))
    expect(screen.getByTestId('notif-accept-btn')).toBeDisabled()

    resolve()
    await waitFor(() => {
      expect(screen.getByTestId('notif-accept-btn')).not.toBeDisabled()
    })
  })

  it('"Yes, notify me" button meets 48px min-height requirement', () => {
    render(
      <NotificationOptInSheet
        visible={true}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    const btn = screen.getByTestId('notif-accept-btn')
    // Style check: minHeight set as inline style
    expect(btn).toHaveStyle({ minHeight: '48px' })
  })
})
