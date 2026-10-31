/**
 * Bus local de eventos de tiempo real. El socket (`useRealtimeInvalidation`)
 * publica aquí el payload de cada evento; quien necesite reaccionar a él (el
 * aviso de un pedido del agente) se suscribe sin tocar el socket, así sobrevive
 * a las reconexiones.
 */
type Listener = (payload: unknown) => void

const listeners = new Map<string, Set<Listener>>()

/** Escucha un evento. Devuelve la función para dejar de escucharlo. */
export const subscribeRealtime = (event: string, listener: Listener): (() => void) => {
    const set = listeners.get(event) ?? new Set<Listener>()
    set.add(listener)
    listeners.set(event, set)
    return () => {
        set.delete(listener)
        if (set.size === 0) listeners.delete(event)
    }
}

/** Entrega el payload a quienes escuchan ese evento (un error no corta a los demás). */
export const publishRealtime = (event: string, payload: unknown): void => {
    for (const listener of [...(listeners.get(event) ?? [])]) {
        try {
            listener(payload)
        } catch {
            // Un listener roto no debe tumbar el resto ni el socket.
        }
    }
}
