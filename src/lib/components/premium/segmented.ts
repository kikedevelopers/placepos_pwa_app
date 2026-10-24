/**
 * Geometría del control segmentado: segmentos de ANCHO IGUAL, así el indicador
 * se posiciona con un porcentaje (transform) sin medir el DOM. Moverlo con
 * `transform` no dispara layout y la transición es interrumpible.
 */
export function thumbTransform(index: number, count: number): string {
    if (count <= 0) return 'translateX(0%)'
    const safe = Math.min(Math.max(Math.trunc(index), 0), count - 1)
    return `translateX(${safe * 100}%)`
}

/** Ancho del indicador como fracción del carril (descontando el padding). */
export function thumbWidth(count: number): string {
    return count > 0 ? `calc((100% - 8px) / ${count})` : '0px'
}
