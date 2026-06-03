import { io, type Socket } from 'socket.io-client'

/**
 * Conexión Socket.IO única para toda la PWA (espejo del cliente de placepos en
 * `src/renderer/src/realtime`). El servidor (pos_api) monta el gateway en el
 * MISMO host/puerto que la API, autentica por JWT en el handshake (`auth.token`)
 * y aísla por rooms de company, así que el cliente solo conecta y escucha: no
 * replica permisos.
 */
let socket: Socket | null = null

export const getRealtimeSocket = (): Socket | null => socket

/**
 * (Re)conecta con el token dado. Si ya había una conexión la cierra primero
 * para no acumular sockets ni listeners al refrescar el token o reentrar.
 */
export const connectRealtime = (baseUrl: string, token: string): Socket => {
    disconnectRealtime()
    socket = io(baseUrl, {
        auth: { token },
        // Solo WebSocket: detrás del edge de nginx el upgrade está garantizado y
        // evitamos el polling de arranque (paridad con el cliente Electron).
        transports: ['websocket']
    })
    return socket
}

export const disconnectRealtime = (): void => {
    if (!socket) return
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
}
