import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/story-map/',
  root: resolve(__dirname, 'src'),
  envDir: resolve(__dirname),
  publicDir: resolve(__dirname, 'src', 'public'),
  plugins: [
    VitePWA({
      manifest: {
        name: 'Story Map App',
        short_name: 'StoryApp',
        description: 'Share and discover stories with locations.',
        theme_color: '#007bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Add New Story',
            short_name: 'Add Story',
            description: 'Create and share a new story with a location.',
            url: '/#/add-story',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }]
          }
        ],
        screenshots: [
          {
            src: 'screenshots/screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop View of Story Map App'
          },
          {
            src: 'screenshots/screenshot-mobile.png',
            sizes: '720x1280',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile View of Story Map App'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
        importScripts: ['sw-push-handler.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/story-api\.dicoding\.dev\/images\/stories\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'story-images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
