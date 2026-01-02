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
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
                    'lucide': ['lucide-react'],
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                },
            },
        },
    },
})
