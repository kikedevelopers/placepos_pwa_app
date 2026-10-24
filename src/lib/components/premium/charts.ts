/**
 * Geometría de las gráficas SVG del kit premium (sin librería: ligeras y con
 * acabado propio). Todo puro y testeado; los componentes solo pintan.
 */

export interface Point {
    x: number
    y: number
}

/** Techo "redondo" para el eje: 1, 2, 2,5 o 5 × 10ⁿ por encima del máximo. */
export function niceMax(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 1
    const exp = Math.floor(Math.log10(value))
    const base = 10 ** exp
    for (const step of [1, 2, 2.5, 5, 10]) {
        if (value <= step * base) return step * base
    }
    return 10 * base
}

/** Monto corto para ejes y etiquetas: $850, $119k, $1,2M. */
export function shortMoney(value: number): string {
    const v = Number.isFinite(value) ? value : 0
    const sign = v < 0 ? '−' : ''
    const abs = Math.abs(v)
    if (abs >= 1_000_000) {
        return `${sign}$${(abs / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })}M`
    }
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`
    return `${sign}$${Math.round(abs)}`
}

/** Hora compacta del eje: 12a, 8a, 12m, 3p. */
export function shortHour(h: number): string {
    if (h === 0) return '12a'
    if (h === 12) return '12m'
    return h < 12 ? `${h}a` : `${h - 12}p`
}

/** Hora completa: "8:00 a. m." / "3:00 p. m.". */
export function fullHour(h: number): string {
    const suffix = h < 12 ? 'a. m.' : 'p. m.'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:00 ${suffix}`
}

/**
 * Puntos de una serie dentro de un lienzo `width × height`. La serie de un solo
 * valor se centra; todo en cero queda sobre la base.
 */
export function seriesPoints(values: readonly number[], width: number, height: number, max = niceMax(Math.max(0, ...values))): Point[] {
    const n = values.length
    if (n === 0) return []
    const top = max > 0 ? max : 1
    return values.map((v, i) => ({
        x: n === 1 ? width / 2 : (i / (n - 1)) * width,
        y: height - (Math.max(0, Number.isFinite(v) ? v : 0) / top) * height
    }))
}

const fmt = (n: number): string => Number(n.toFixed(2)).toString()

/** Trazo de línea (`M x y L …`). */
export function linePath(points: readonly Point[]): string {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x)} ${fmt(p.y)}`).join(' ')
}

/** Área cerrada bajo la línea hasta la base (para el degradado). */
export function areaPath(points: readonly Point[], height: number): string {
    if (points.length === 0) return ''
    const first = points[0]
    const last = points[points.length - 1]
    return `${linePath(points)} L${fmt(last.x)} ${fmt(height)} L${fmt(first.x)} ${fmt(height)} Z`
}

/** Índice del punto más cercano a una coordenada X (para el cursor táctil). */
export function nearestIndex(x: number, width: number, count: number): number {
    if (count <= 1 || width <= 0) return 0
    const ratio = Math.min(Math.max(x / width, 0), 1)
    return Math.round(ratio * (count - 1))
}

export interface Bar {
    x: number
    y: number
    width: number
    height: number
}

/** Barras verticales repartidas con separación; altura proporcional al máximo. */
export function barLayout(values: readonly number[], width: number, height: number, gap = 16): Bar[] {
    const n = values.length
    if (n === 0) return []
    const max = niceMax(Math.max(0, ...values))
    const barWidth = Math.max(0, (width - gap * (n - 1)) / n)
    return values.map((v, i) => {
        const h = (Math.max(0, Number.isFinite(v) ? v : 0) / max) * height
        return { x: i * (barWidth + gap), y: height - h, width: barWidth, height: h }
    })
}
