import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  assetsInclude: ['**/*.geojson'],
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.setHeader('X-Frame-Options', 'DENY')
          res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:4000; connect-src 'self' http://localhost:4000; frame-ancestors 'none'")
          next()
        })
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 3000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      
        drop_debugger: true,     
        passes: 3                
      },
      mangle: {
        toplevel: true          
      },
      format: {
        comments: false          
      }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined  
      }
    },
    sourcemap: false             
  }
})