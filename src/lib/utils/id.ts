/**
 * UUID v4 para `client_operation_id` (idempotencia del cobro). No requiere
 * criptografía fuerte: solo evitar colisiones entre intentos de cobro.
 */
export const uuidv4 = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
