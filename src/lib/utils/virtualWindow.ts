/**
 * Ventana de virtualización de alto FIJO (todas las filas miden lo mismo).
 *
 * Es la matemática pura detrás de `VirtualList.svelte`: dado el scroll actual,
 * el alto del viewport y el alto de una fila, calcula qué rango de filas hay
 * que montar en el DOM (`start`..`end`), cuánto desplazar el bloque visible
 * (`offsetTop`) y la altura total del contenido (`totalHeight`) para que la
 * barra de scroll sea exacta.
 *
 * Se separa del componente para poder probarla sin DOM: el congelamiento al
 * entrar a Inventario/POS venía de montar ~660 tarjetas de golpe; aquí se
 * acota a las visibles + un pequeño colchón (`overscan`).
 *
 * El `gap` entre filas se modela como parte del "paso" (`rowHeight + gap`): el
 * bloque visible se pinta con `display:flex; gap`, así la posición de la fila
 * `i` es siempre `padStart + i * step`, coincidiendo con `offsetTop`.
 */
export interface VirtualRangeInput {
    /** scrollTop actual del contenedor (px). */
    scrollTop: number
    /** Alto visible del contenedor (clientHeight, px). */
    viewportHeight: number
    /** Alto de UNA fila, sin el gap (px). */
    rowHeight: number
    /** Separación vertical entre filas (px). */
    gap: number
    /** Número total de filas. */
    count: number
    /** Filas extra a montar por arriba y por abajo (colchón anti-parpadeo). */
    overscan: number
    /** Relleno superior del contenido (px). Ej. un `padding-top`. */
    padStart?: number
    /** Relleno inferior del contenido (px). Ej. espacio para la barra de carrito. */
    padEnd?: number
}

export interface VirtualRange {
    /** Primer índice a montar (inclusive). */
    start: number
    /** Índice final a montar (EXCLUSIVO). */
    end: number
    /** Desplazamiento del bloque visible (translateY, px). */
    offsetTop: number
    /** Altura total del contenido scrolleable (px). */
    totalHeight: number
}

/** Acota `v` al rango `[min, max]`. */
const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v

export function computeVirtualRange(input: VirtualRangeInput): VirtualRange {
    const {
        scrollTop,
        viewportHeight,
        rowHeight,
        gap,
        count,
        overscan,
        padStart = 0,
        padEnd = 0
    } = input

    if (count <= 0) {
        return { start: 0, end: 0, offsetTop: padStart, totalHeight: padStart + padEnd }
    }

    const step = rowHeight + gap
    // Altura total: filas + gaps internos (count-1) + rellenos.
    const totalHeight = padStart + (count * rowHeight + (count - 1) * gap) + padEnd

    // Alto de fila inválido: por seguridad, montar todo (sin virtualizar) en vez
    // de dividir por cero o dejar la lista en blanco.
    if (step <= 0 || viewportHeight <= 0) {
        return { start: 0, end: count, offsetTop: padStart, totalHeight }
    }

    // Posición del scroll relativa al inicio de las filas (descontando padStart).
    const top = scrollTop - padStart
    const firstVisible = clamp(Math.floor(top / step), 0, count - 1)
    const lastVisible = clamp(Math.floor((top + viewportHeight) / step), 0, count - 1)

    const start = clamp(firstVisible - overscan, 0, count - 1)
    const end = clamp(lastVisible + 1 + overscan, start, count)

    const offsetTop = padStart + start * step

    return { start, end, offsetTop, totalHeight }
}

/**
 * Parte una lista plana en filas de `size` elementos (para grillas
 * virtualizadas: cada "fila" de la ventana es una fila de la grilla con
 * `columns` tarjetas). La última fila puede quedar incompleta.
 */
export function chunk<T>(items: T[], size: number): T[][] {
    if (size <= 1) return items.map((it) => [it])
    const rows: T[][] = []
    for (let i = 0; i < items.length; i += size) {
        rows.push(items.slice(i, i + size))
    }
    return rows
}
