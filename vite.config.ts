import { sveltekit } from '@sveltejs/kit/vite'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}']
            },
            manifest: {
                name: 'PlacePOS',
                short_name: 'PlacePOS',
                description: 'Punto de venta — versión web (PWA)',
                theme_color: '#1867d8',
                background_color: '#f5f8fc',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    {
                        src: '/icons/icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            // En desarrollo también se sirve el manifest. Sin él, iOS 26 instala
            // el ícono como acceso directo antiguo (no como web app): ignora
            // black-translucent, deja franjas del sistema arriba y abajo y no
            // activa `display-mode: standalone`. Probar desde el teléfono contra
            // el servidor de desarrollo exige el manifest. El service worker no
            // se registra en dev (el layout pide /sw.js, que solo existe en el
            // build), así que no interfiere con la recarga en caliente.
            devOptions: {
                enabled: true,
                type: 'module'
            }
        })
    ],
    server: {
        port: 5180,
        host: true
    }
})
