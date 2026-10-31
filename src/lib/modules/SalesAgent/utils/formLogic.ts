import type { UpdateSalesBotConfigPayload } from '$lib/api/requests/salesBot'

/**
 * Estado editable del formulario del bot de Telegram. La persona (nombre y
 * personalidad) vive en los ajustes del agente, común a todos los canales.
 */
export interface SalesBotFormState {
    owner_chat_id: string
    /** Token nuevo escrito por el usuario; vacío = conservar el guardado. */
    token: string
    enabled: boolean
}

export interface SalesBotFormErrors {
    token?: string
}

export interface ValidationContext {
    /** ¿El negocio ya tiene un token guardado en el servidor? */
    hasSavedToken: boolean
}

export type ValidationResult =
    | { ok: true; payload: UpdateSalesBotConfigPayload }
    | { ok: false; errors: SalesBotFormErrors }

/**
 * Valida el formulario y arma el payload para guardar. Pura (sin React) para
 * poder testearla. Reglas:
 *   - No se puede ACTIVAR el bot sin un token (ni guardado ni nuevo).
 *   - El token solo viaja si el usuario escribió uno nuevo (vacío = conservar).
 */
export const validateSalesBotForm = (
    form: SalesBotFormState,
    ctx: ValidationContext
): ValidationResult => {
    const errors: SalesBotFormErrors = {}

    const newToken = form.token.trim()
    const willHaveToken = ctx.hasSavedToken || newToken.length > 0
    if (form.enabled && !willHaveToken) {
        errors.token = 'Para activar el bot primero pega el token de Telegram.'
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors }
    }

    const payload: UpdateSalesBotConfigPayload = {
        enabled: form.enabled,
        owner_chat_id: form.owner_chat_id.trim()
    }
    // Solo mandamos el token si lo cambiaron (no reenviamos el secreto).
    if (newToken.length > 0) {
        payload.token = newToken
    }

    return { ok: true, payload }
}
