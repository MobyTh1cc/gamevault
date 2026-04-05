import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change '/gamevault/' to your GitHub repo name if different
export default defineConfig({
  plugins: [react()],
  base: '/gamevault/',
})
