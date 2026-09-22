import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'Focus Alfajoreria',
        short_name: 'Focus POC',
        description: 'Sistema de gestion offline-first para alfajoreria artesanal',
        theme_color: '#d97706',
        background_color: '#fffbeb',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        // El cacheo de /api/* NO se maneja con Workbox: la logica de
        // "network-first + fallback IndexedDB" y la cola de escrituras
        // vive en src/api y src/sync, porque necesita decisiones de
        // negocio (deltas de stock, cola persistente) que Workbox no
        // puede tomar por si solo. El Service Worker solo cachea el
        // shell de la app (JS/CSS/HTML) para que abra offline.
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    // Permite acceder via el hostname publico del tunel de Cloudflare
    // (*.trycloudflare.com), que Vite bloquearia por defecto al no
    // reconocer el Host header. Solo para pruebas temporales.
    allowedHosts: true,
  },
  preview: {
    port: 4173,
    allowedHosts: true,
  },
});
