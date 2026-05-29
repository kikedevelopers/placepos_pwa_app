import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        // App 100% cliente (PWA) que consume el backend externo por HTTP.
        // adapter-static con fallback => SPA: el router de SvelteKit corre en
        // el navegador y AuthGate decide la pantalla. Sin SSR.
        adapter: adapter({
            fallback: 'index.html',
            precompress: false,
            strict: false
        }),
        alias: {
            '@': 'src',
            '$lib': 'src/lib'
        }
    }
}

export default config
