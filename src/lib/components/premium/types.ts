import type { Tone } from './tones'

/** Una celda de la rejilla de métricas (`Metrics`). */
export interface MetricItem {
    label: string
    amount?: number
    text?: string
    hint?: string
    tone?: Tone
}
