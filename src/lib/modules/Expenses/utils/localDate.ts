/**
 * Convierte un string `YYYY-MM-DD` proveniente de un input `type="date"` en
 * un `Date` ubicado al **mediodía local**. Esto evita el clásico bug donde
 * `new Date("2026-05-22")` se interpreta como UTC midnight y, para usuarios
 * detrás de GMT, retrocede un día en la BD.
 */
export const parseLocalYmd = (ymd: string): Date => new Date(`${ymd}T12:00:00`)

/**
 * Formatea un `Date` o un ISO string como `YYYY-MM-DD` en la **zona local**.
 * Sirve para alimentar inputs HTML `type="date"` cuando se viene de un valor
 * almacenado en UTC.
 */
export const formatLocalYmd = (input: Date | string): string => {
    const date = typeof input === 'string' ? new Date(input) : input
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
