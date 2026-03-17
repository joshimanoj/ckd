import { defineConfig, devices } from '@playwright/test'

const useEmulator = process.env['FIREBASE_EMULATOR_RUNNING'] === '1'
// Use a dedicated port for emulator runs so the normal dev server (5173) is not reused
const devServerPort = useEmulator ? 5174 : 5173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${devServerPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: useEmulator
      ? `VITE_USE_EMULATOR=true node node_modules/.bin/vite --mode test --port ${devServerPort}`
      : 'node node_modules/.bin/vite --mode test',
    url: `http://localhost:${devServerPort}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 30000,
  },
})
