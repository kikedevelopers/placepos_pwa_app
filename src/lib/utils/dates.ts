const pad = (n: number): string => String(n).padStart(2, '0')

/** Fecha local en formato `YYYY-MM-DD` (el que esperan los endpoints). */
export const todayISO = (): string => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Resta `days` días a hoy y devuelve `YYYY-MM-DD`. */
export const daysAgoISO = (days: number): string => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Suma `days` días a hoy y devuelve `YYYY-MM-DD` (fechas de vencimiento). */
export const daysAheadISO = (days: number): string => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Primer día del mes actual en `YYYY-MM-DD`. */
export const monthStartISO = (): string => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

export const formatDateTime = (iso: string): string =>
    new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(iso))

export const formatShortDate = (iso: string): string =>
    new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(iso))
