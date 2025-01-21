import { defineConfig } from 'vite'; // v4.3.x
import react from '@vitejs/plugin-react'; // v4.0.x
import { resolve } from 'path';

// Vite configuration for Identity Matrix web frontend
export default defineConfig({
  // React plugin configuration with optimizations
  plugins: [
    react({
      // Babel configuration for optimal JSX transformation
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],

  // Path resolution and aliases matching tsconfig.json
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@config': resolve(__dirname, 'src/config'),
      '@constants': resolve(__dirname, 'src/constants'),
      '@types': resolve(__dirname, 'src/types')
    }
  },

  // Build configuration for production optimization
  build: {
    // Target modern browsers for better optimization
    target: 'es2022',
    // Output directory configuration
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable minification with terser for better compression
    minify: 'terser',
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Terser options for aggressive optimization
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Rollup specific options for chunk optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Core vendor dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // State management bundle
          redux: ['@reduxjs/toolkit', 'react-redux'],
          // UI component libraries
          ui: ['@mui/material', 'styled-components'],
          // Utility libraries
          utils: ['axios', 'chart.js', 'dayjs']
        },
        // Asset naming strategy
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js'
      }
    },
    // Performance optimizations
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  },

  // Development server configuration
  server: {
    // Development port
    port: 3000,
    // Enforce strict port usage
    strictPort: true,
    // Enable host for network access
    host: true,
    // CORS configuration
    cors: true,
    // Security headers
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },

  // Preview server configuration (for production builds)
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: true
  },

  // Performance optimizations
  optimizeDeps: {
    // Include dependencies that need optimization
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      '@mui/material',
      'styled-components',
      'axios',
      'chart.js',
      'dayjs'
    ]
  },

  // Enable SWC for faster builds
  esbuild: {
    jsxInject: `import React from 'react'`
  }
});