import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Enable HMR with WebSocket
    hmr: true,
    // Use polling for file watching on Windows (more reliable)
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
