import { test, expect } from '@playwright/test'

test.describe('FT-6: Responsive rendering at 375px, 480px, 768px', () => {
  const viewports = [
    { name: '375px (iPhone SE)', width: 375, height: 812 },
    { name: '480px', width: 480, height: 844 },
    { name: '768px (tablet)', width: 768, height: 1024 },
  ]

  for (const vp of viewports) {
    test(`should render correctly and have no horizontal scroll at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')

      await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

      // All key elements visible
      await expect(page.getByTestId('creator-photo')).toBeVisible()
      await expect(page.getByTestId('app-name')).toBeVisible()
      await expect(page.getByTestId('google-signin-btn')).toBeVisible()

      // No horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    })
  }
})
