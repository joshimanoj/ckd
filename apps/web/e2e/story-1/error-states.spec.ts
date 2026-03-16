import { test, expect } from '@playwright/test'

test.describe('FT-7: Error states — network failure, cancel, offline', () => {
  test('network failure: sign-in screen remains visible and recoverable after button click', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    // Intercept Firebase auth API calls to simulate network failure
    await page.route('**/identitytoolkit.googleapis.com/**', (route) => route.abort('failed'))
    await page.route('**/securetoken.googleapis.com/**', (route) => route.abort('failed'))

    const btn = page.getByTestId('google-signin-btn')
    await btn.click()

    // Button re-enabled after the call resolves/rejects
    await expect(btn).toBeEnabled({ timeout: 10000 })
    // Sign in screen still visible — no crash, no blank screen
    await expect(page.getByTestId('sign-in-screen')).toBeVisible()
  })

  test('offline on launch: should show offline screen with "Check your connection"', async ({ page }) => {
    // Load page while online first so it can serve
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    // Simulate going offline via window event (OnboardingPage listens for this)
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })

    await expect(page.getByTestId('offline-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Check your connection')).toBeVisible()
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()

    // Simulate network restore and retry
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 5000 })
  })
})
