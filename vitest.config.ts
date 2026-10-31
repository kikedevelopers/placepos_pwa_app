import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const alias = {
    $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    '@': fileURLToPath(new URL('./src', import.meta.url))
}

// Config dedicada a tests (no la del app/PWA): compila .svelte (lucide) y
// resuelve los alias `$lib`/`@` del repo. Dos proyectos:
//   - `unit`: entorno node, lógica pura y render SSR (`svelte/server`).
//   - `dom`:  `*.dom.test.ts`, monta componentes de verdad en happy-dom
//             (efectos, clics); Svelte se resuelve con la condición `browser`.
export default defineConfig({
    plugins: [svelte({ hot: false })],
    resolve: { alias },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/**/*.{test,spec}.{js,ts}'],
                    exclude: ['src/**/*.dom.test.ts']
                }
            },
            {
                extends: true,
                resolve: {
                    conditions: ['browser'],
                    alias: {
                        '$app/environment': fileURLToPath(
                            new URL('./src/test-stubs/app-environment.ts', import.meta.url)
                        )
                    }
                },
                test: {
                    name: 'dom',
                    environment: 'happy-dom',
                    include: ['src/**/*.dom.test.ts'],
                    setupFiles: ['src/test-stubs/dom-setup.ts']
                }
            }
        ]
    }
})
