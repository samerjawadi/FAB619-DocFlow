import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  // On GitHub Pages, app is typically served from /<repo>/.
  base: process.env.GITHUB_PAGES === 'true'
    ? `/${(process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''}/`
    : '/',
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.json',
      json: true,
    }),
  ],
})
