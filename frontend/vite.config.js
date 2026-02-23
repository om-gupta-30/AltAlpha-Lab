import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'recharts': ['recharts'],
          // UI components
          'charts': [
            './src/components/PriceChart.jsx',
            './src/components/SentimentChart.jsx',
            './src/components/PortfolioChart.jsx',
            './src/components/DrawdownChart.jsx',
            './src/components/ComparisonChart.jsx',
            './src/components/RollingSharpeChart.jsx',
            './src/components/ChartCard.jsx',
          ],
        },
      },
    },
  },
})
