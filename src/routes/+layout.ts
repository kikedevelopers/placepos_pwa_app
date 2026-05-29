// App 100% cliente (PWA/SPA): sin SSR ni prerender de rutas; el adapter-static
// genera el shell (index.html) como fallback y el router corre en el navegador.
export const ssr = false
export const prerender = false
export const trailingSlash = 'never'
