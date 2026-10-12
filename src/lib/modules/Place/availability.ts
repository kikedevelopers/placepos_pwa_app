import { createQuery } from '@tanstack/svelte-query'
import { getAiStatus } from '$lib/api/requests/ai'

export { shouldBlockPlaceRoute } from './lib/guard'

/** Misma key en toda la app: el botón, el guard y el chat comparten el estado. */
export const AI_STATUS_QUERY_KEY = ['ai-status'] as const

/**
 * Estado del asistente Place. `enabled` combina (en el servidor) la llave de
 * Gemini con el flag por cuenta `companies.ai_enabled`. Con enabled:false el
 * botón se oculta y la ruta del chat se bloquea.
 */
export const usePlaceStatus = () =>
    createQuery({
        queryKey: AI_STATUS_QUERY_KEY,
        queryFn: getAiStatus,
        staleTime: 5 * 60 * 1000,
        retry: 0
    })
