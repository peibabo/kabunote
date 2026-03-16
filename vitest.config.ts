import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Node.js 25+ has native localStorage that conflicts with jsdom
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
const execArgv = nodeMajor >= 25 ? ['--no-experimental-webstorage'] : []

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    css: false,
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    execArgv,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
