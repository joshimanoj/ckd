import { test, expect } from '@playwright/test'

test.describe('FT-1: Sign In screen renders correctly', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase Auth to keep user unauthenticated
    await page.addInitScript(() => {
      // Mock onAuthStateChanged to immediately call with null (no user)
      Object.defineProperty(window, '__firebaseAuthMock', { value: true })
    })
    await page.route('**/firebase.googleapis.com/**', (route) => route.abort())
    await page.route('**/identitytoolkit.googleapis.com/**', (route) => route.abort())
  })

  test('should render creator photo, app name, and Continue with Google button', async ({ page }) => {
    await page.goto('/')

    // Wait for sign in screen (not redirected)
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    // Creator photo
    await expect(page.getByTestId('creator-photo')).toBeVisible()

    // App name
    await expect(page.getByTestId('app-name')).toBeVisible()
    await expect(page.getByTestId('app-name')).toHaveText('Choti Ki Duniya')

    // Button
    await expect(page.getByTestId('google-signin-btn')).toBeVisible()
    await expect(page.getByTestId('google-signin-btn')).toBeEnabled()
  })

  test('should have brand gradient on upper half', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    // Check gradient background is present in page HTML
    const gradient = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        const style = window.getComputedStyle(el)
        if (style.background.includes('135deg') || style.backgroundImage.includes('135deg')) {
          return true
        }
      }
      return false
    })
    expect(gradient).toBe(true)
  })

  test('no horizontal scrollbar at 480px viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 844 })
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})
