/*
 * Notificaciones push de PlacePOS (lo importa el service worker que genera
 * vite-plugin-pwa: `workbox.importScripts`).
 *
 * pos_api envía un JSON { title, body, url, tag, company_id, order_id }.
 *   - Se muestra SIEMPRE una notificación (iOS y Chrome lo exigen; si no, retiran
 *     la suscripción). Con la app en primer plano va en silencio: ahí ya sale el
 *     aviso dentro de la app.
 *   - Misma `tag` = el mismo pedido: reemplaza la anterior y vuelve a sonar.
 *   - Al tocarla se enfoca la app abierta y navega a `url`; si no hay ninguna
 *     abierta, se abre en esa ruta.
 */
/* eslint-disable no-restricted-globals */

const FALLBACK = { title: 'PlacePOS', body: 'Tienes una notificación nueva.', url: '/' }

const readPayload = (event) => {
    if (!event.data) return FALLBACK
    try {
        const data = event.data.json()
        return {
            title: typeof data.title === 'string' && data.title ? data.title : FALLBACK.title,
            body: typeof data.body === 'string' ? data.body : FALLBACK.body,
            url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/',
            tag: typeof data.tag === 'string' ? data.tag : undefined
        }
    } catch {
        return { ...FALLBACK, body: event.data.text() || FALLBACK.body }
    }
}

self.addEventListener('push', (event) => {
    const payload = readPayload(event)
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const focused = clients.some(
                (client) => client.focused && client.visibilityState === 'visible'
            )
            return self.registration.showNotification(payload.title, {
                body: payload.body,
                tag: payload.tag,
                renotify: Boolean(payload.tag),
                silent: focused,
                icon: '/icons/icon-192.png',
                badge: '/icons/badge-96.png',
                data: { url: payload.url }
            })
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = new URL(event.notification.data?.url || '/', self.location.origin).href
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
            const client = clients.find((c) => c.url.startsWith(self.location.origin))
            if (client) {
                await client.focus()
                // La app navega sola (SvelteKit) al recibir el mensaje; `navigate`
                // queda de respaldo si no responde.
                client.postMessage({ type: 'placepos:navigate', url })
                return
            }
            await self.clients.openWindow(url)
        })
    )
})
