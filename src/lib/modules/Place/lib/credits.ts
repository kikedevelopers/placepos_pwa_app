/**
 * Créditos diarios de Place: cuántas preguntas le quedan HOY a la cuenta. Los
 * asigna el administrador del sistema; con 0 el chat se bloquea hasta mañana.
 *
 * Espejo de `lib/credits.ts` de placepos. Puro. Llegan por dos vías — `/ai/status` (al abrir) y el evento SSE
 * `credits` (al enviar cada mensaje) — y gana la más reciente.
 */

export interface AiCredits {
    daily_limit: number
    used_today: number
    remaining: number
}

/** Créditos con el instante (epoch ms) en que se supieron. */
export interface TimedCredits {
    credits: AiCredits
    at: number
}

/** Lo que ve el usuario cuando se le acabaron las consultas del día. */
export const CREDITS_EXHAUSTED_MESSAGE =
    'Ya consumiste tus consultas de hoy, por lo que no puedes hacerle más preguntas a Place. Se renuevan mañana.'

const count = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : null

/**
 * Valida los créditos que manda el servidor. `null` si no vinieron (servidor
 * de una versión anterior): entonces NO se bloquea nada.
 */
export const parseCredits = (raw: unknown): AiCredits | null => {
    if (!raw || typeof raw !== 'object') return null
    const data = raw as Record<string, unknown>
    const daily_limit = count(data.daily_limit)
    const used_today = count(data.used_today)
    const remaining = count(data.remaining)
    if (daily_limit === null || used_today === null || remaining === null) return null
    return { daily_limit, used_today, remaining }
}

/** La lectura más reciente de las dos (cualquiera puede faltar). */
export const latestCredits = (
    a: TimedCredits | null | undefined,
    b: TimedCredits | null | undefined
): AiCredits | null => {
    if (!a) return b?.credits ?? null
    if (!b) return a.credits
    return a.at >= b.at ? a.credits : b.credits
}

export const isOutOfCredits = (credits: AiCredits | null): boolean =>
    credits !== null && credits.remaining <= 0

/** "Te quedan 3 consultas hoy" — solo cuando hay límite y no está agotado. */
export const describeRemaining = (credits: AiCredits | null): string | null => {
    if (!credits || credits.remaining <= 0) return null
    return credits.remaining === 1
        ? 'Te queda 1 consulta hoy'
        : `Te quedan ${credits.remaining} consultas hoy`
}
