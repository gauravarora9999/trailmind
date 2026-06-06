import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import os from 'node:os'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Keep Vite's dependency-optimizer cache OFF OneDrive. OneDrive locks files
  // inside node_modules/.vite, corrupting the cache and breaking
  // "react-router/dom" resolution in the dev server. A local-disk dir fixes it.
  cacheDir: path.join(os.tmpdir(), 'vite-trailmind-cache'),
})
