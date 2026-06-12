/**
 * UUID v4 con fallback para contextos NO seguros.
 *
 * `crypto.randomUUID()` solo existe en *secure contexts* (HTTPS o localhost). En
 * dev la PWA se sirve por LAN en HTTP plano (http://192.168.x.x), donde
 * `crypto.randomUUID` es `undefined` y lanzaría al usarlo — rompiendo el registro
 * de pedidos y el cobro (que dependen de una llave de idempotencia estable).
 *
 * `crypto.getRandomValues` SÍ está disponible fuera de secure context, así que lo
 * usamos como respaldo criptográfico; y como último recurso, Math.random.
 */
export const randomUUID = (): string => {
    const c = typeof crypto !== 'undefined' ? crypto : undefined

    if (c && typeof c.randomUUID === 'function') {
        return c.randomUUID()
    }

    if (c && typeof c.getRandomValues === 'function') {
        const bytes = c.getRandomValues(new Uint8Array(16))
        bytes[6] = (bytes[6] & 0x0f) | 0x40 // versión 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante 10xx
        const hex: string[] = []
        for (const b of bytes) hex.push(b.toString(16).padStart(2, '0'))
        return (
            hex.slice(0, 4).join('') +
            '-' +
            hex.slice(4, 6).join('') +
            '-' +
            hex.slice(6, 8).join('') +
            '-' +
            hex.slice(8, 10).join('') +
            '-' +
            hex.slice(10, 16).join('')
        )
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0
        const v = ch === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}
