/**
 * Tonos semánticos del kit premium. El color SOLO comunica significado
 * (entra/sale dinero, alerta, neutro): nunca decora. Clases literales para que
 * el JIT de Tailwind las detecte.
 */
export type Tone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'brand' | 'muted'

export const TONE_TEXT: Record<Tone, string> = {
    neutral: 'text-foreground',
    positive: 'text-success',
    negative: 'text-destructive',
    warning: 'text-warning',
    info: 'text-info',
    brand: 'text-primary',
    muted: 'text-muted-foreground'
}

/** Fondo tenue + texto, para pastillas e iconos. */
export const TONE_SOFT: Record<Tone, string> = {
    neutral: 'bg-foreground/[0.06] text-foreground',
    positive: 'bg-success/10 text-success',
    negative: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/[0.12] text-warning',
    info: 'bg-info/10 text-info',
    brand: 'bg-primary/10 text-primary',
    muted: 'bg-muted-foreground/10 text-muted-foreground'
}

/** Tono de un monto según su signo (0 → neutral). */
export const toneForAmount = (value: number, positive: Tone = 'positive'): Tone =>
    value > 0 ? positive : value < 0 ? 'negative' : 'neutral'
