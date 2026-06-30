import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Config dedicada a tests (no la del app/PWA): compila .svelte (lucide) y
// resuelve los alias `$lib`/`@` del repo. Entorno node: las pruebas son de
// lógica pura (permisos y filtrado de tabs), sin DOM.
export default defineConfig({
    plugins: [svelte({ hot: false })],
    resolve: {
        alias: {
            $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    test: {
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,ts}']
    }
})
