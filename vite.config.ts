import path from 'path'
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core dependencies
          'react-vendor': ['react', 'react-dom'],
          
          // Three.js core library (largest chunk)
          'three-core': ['three'],
          
          // React Three Fiber and Drei (3D React utilities)
          'three-react': ['@react-three/fiber', '@react-three/drei'],
          
          // Radix UI components (large bundle)
          'ui-vendor': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          
          // Utility libraries
          'utils-vendor': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'lucide-react'
          ],
          
          // Other UI libraries
          'misc-vendor': ['react-resizable-panels']
        }
      }
    },
    
    // Increase chunk size warning limit for 3D graphics libraries
    // Three.js is inherently large due to 3D math and geometry operations
    chunkSizeWarningLimit: 1200,
    
    // Enable source maps for better debugging in production
    sourcemap: false
  },
  
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})