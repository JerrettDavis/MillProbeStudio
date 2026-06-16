import path from 'path'
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';
import { codecovVitePlugin } from "@codecov/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), 
    tsconfigPaths(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "mill-probe-studio",
      uploadToken: process.env.CODECOV_TOKEN,
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/MillProbeStudio/' : '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react-vendor';
          }

          if (id.includes('/three/')) {
            return 'three-core';
          }

          if (id.includes('/@react-three/')) {
            return 'three-react';
          }

          if (id.includes('/@radix-ui/')) {
            return 'ui-vendor';
          }

          if (
            id.includes('/clsx/') ||
            id.includes('/tailwind-merge/') ||
            id.includes('/class-variance-authority/') ||
            id.includes('/lucide-react/')
          ) {
            return 'utils-vendor';
          }

          if (id.includes('/react-resizable-panels/')) {
            return 'misc-vendor';
          }

          return undefined;
        }
      }
    },
    
    // Increase chunk size warning limit for 3D graphics libraries
    // Three.js is inherently large due to 3D math and geometry operations
    chunkSizeWarningLimit: 1200,
    
    // Enable source maps for better debugging in production
    sourcemap: false
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
