/**
 * Tiempo hasta el próximo corte de un gasto fijo, en formato compacto. Puro:
 * recibe "ahora" para poder testearlo sin reloj.
 */
export function remainingParts(end: Date, now: Date): { days: number; hours: number; minutes: number } | null {
    const diff = end.getTime() - now.getTime()
    if (!Number.isFinite(diff) || diff <= 0) return null
    const totalMinutes = Math.floor(diff / 60_000)
    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes - days * 1440) / 60)
    return { days, hours, minutes: totalMinutes - days * 1440 - hours * 60 }
}

/** Para el resumen: "En 3 d · 4 h", "En 5 h", "En 12 m", "Ahora" o "—" sin gastos. */
export function nextCutLabel(end: Date | null, now: Date): string {
    if (!end) return '—'
    const p = remainingParts(end, now)
    if (!p) return 'Ahora'
    if (p.days > 0) return p.hours > 0 ? `En ${p.days} d · ${p.hours} h` : `En ${p.days} d`
    if (p.hours > 0) return `En ${p.hours} h`
    return `En ${Math.max(1, p.minutes)} m`
}

/** Para la tarjeta: "Faltan 3 d · 4 h", "Faltan 2 h · 5 m", "Se cumple ahora". */
export function remainingLabel(end: Date, now: Date): string {
    const p = remainingParts(end, now)
    if (!p) return 'Se cumple ahora'
    if (p.days > 0) return p.hours > 0 ? `Faltan ${p.days} d · ${p.hours} h` : `Faltan ${p.days} d`
    if (p.hours > 0) return p.minutes > 0 ? `Faltan ${p.hours} h · ${p.minutes} m` : `Faltan ${p.hours} h`
    if (p.minutes > 0) return `Faltan ${p.minutes} m`
    return 'Menos de un minuto'
}
