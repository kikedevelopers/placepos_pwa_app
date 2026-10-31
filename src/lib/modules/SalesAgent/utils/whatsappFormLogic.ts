import type { UpdateWhatsappConfigPayload } from '$lib/api/requests/salesBot'

/**
 * Estado editable del formulario de WhatsApp. La conexión del número se hace
 * escaneando el QR (sesión del escritorio), así que aquí no hay credenciales; la
 * persona (nombre y personalidad) vive en los ajustes del agente.
 */
export interface WhatsappFormState {
    owner_chat_id: string
    enabled: boolean
}

/**
 * Arma el payload de WhatsApp. El número de avisos se manda solo con dígitos
 * (vacío = sin avisos). No envía campos de la Cloud API (phone_number_id,
 * token): el servidor los conserva si existen.
 */
export const buildWhatsappPayload = (form: WhatsappFormState): UpdateWhatsappConfigPayload => ({
    enabled: form.enabled,
    owner_chat_id: form.owner_chat_id.replace(/\D/g, '')
})
