import type { ExpenseRecord, ExpenseSourceType } from '$lib/api/requests/expenses'

/**
 * Presentación de los gastos variables (pura y testeada).
 */
const SOURCE_LABEL: Record<ExpenseSourceType, string> = {
    wallet: 'Billetera',
    bank: 'Banco',
    cash_register: 'Caja'
}

/** "Caja de Enrique" / "Banco · NU BANK" / "Billetera". */
export function sourceLabel(e: Pick<ExpenseRecord, 'source_type' | 'source_name'>): string {
    const kind = SOURCE_LABEL[e.source_type] ?? 'Fuente'
    const name = e.source_name?.trim()
    if (!name) return kind
    // "Caja de Enrique Pacheco" ya dice qué es: no repetir "Caja: Caja de…".
    return name.toLowerCase().startsWith(kind.toLowerCase()) ? name : `${kind} · ${name}`
}

/**
 * Instante del gasto para agrupar por día. `expense_date` llega como
 * "YYYY-MM-DD": leído tal cual sería medianoche UTC y en Colombia caería el día
 * ANTERIOR. Se ancla al mediodía local.
 */
export function expenseInstant(e: Pick<ExpenseRecord, 'expense_date' | 'created_at'>): string {
    const date = e.expense_date
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split('-').map(Number)
        return new Date(y, m - 1, d, 12).toISOString()
    }
    return date || e.created_at
}
