/**
 * Extrae un mensaje legible del error rechazado por axios. El interceptor aplana
 * a `{ status, error, payload? }`, pero NestJS a veces usa `message`; cubrimos
 * ambos. Devuelve `undefined` si no hay mensaje (para usar un fallback propio).
 */
export const getErrorMessage = (error: unknown): string | undefined => {
    const e = error as { error?: string; message?: string } | null
    return e?.error ?? e?.message ?? undefined
}
