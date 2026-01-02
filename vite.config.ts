import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
    host: "::",
    port: 54571,
  },
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
})
