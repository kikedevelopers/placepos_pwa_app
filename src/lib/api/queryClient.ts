import { QueryClient } from '@tanstack/svelte-query'

/**
 * No reintentar errores de cliente (4xx: 401 sesión inválida, 402 suscripción
 * vencida, 403 sin rol). Reintentar no los resuelve; solo 5xx/red.
 */
const clientRetry = (failureCount: number, error: unknown): boolean => {
    const status = (error as { status?: number }).status
    if (status && status < 500) return false
    return failureCount < 1
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: clientRetry,
            staleTime: 30_000
        }
    }
})
