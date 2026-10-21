/**
 * Tarjetas que el servidor manda por el evento SSE `card` (vista previa de un
 * pedido o de un movimiento de saldo, y su resultado) — espejo de
 * `lib/cards.ts` de placepos. Se dibujan con
 * ESTOS datos, nunca con lo que el modelo escriba: lo que el usuario confirma es
 * exactamente lo que se crea.
 *
 * Puro y estricto: un payload dudoso no se "arregla", se descarta (mejor no
 * mostrar una factura que mostrar una mal).
 */

/** Una línea de la vista previa, tal cual la armó el servidor. */
export interface SalePreviewLine {
    line: number
    product: string
    size: string | null
    quantity: number
    unit_price: number
    price_label: string
    total: number
    /** Ganancia de la línea; `null` si el usuario no puede ver ganancias. */
    profit: number | null
    /** Margen % de la línea; `null` si el usuario no puede ver ganancias. */
    margin: number | null
    note: string | null
}

/**
 * Vista previa de un pedido esperando el "sí": `pending` (la que se crearía),
 * `superseded` (hubo una más nueva) o `confirmed` (se creó).
 */
export interface SalePreviewCard {
    kind: 'sale_preview'
    customer: string
    lines: SalePreviewLine[]
    total: number
    /** Ganancia y margen del pedido; `null` si el usuario no puede verlos. */
    profit: number | null
    margin: number | null
    warnings: string[]
    status: 'pending' | 'superseded' | 'confirmed'
}

export interface SaleCreatedCard {
    kind: 'sale_created'
    /** Id de la venta para abrir su visor; `null` en tarjetas antiguas. */
    sale_id: number | null
    ticket_number: string
    customer: string
    lines: number
    total: number
}

/** Una cuenta en la vista previa de un traslado (saldo antes y después). */
export interface TreasuryPreviewSide {
    name: string
    /** "caja" | "banco" | "billetera". */
    kind: string
    balance: number
    balance_after: number
}

/** Movimiento de saldo esperando el "sí": traslado o corrección a un saldo final. */
export type TreasuryPreviewCard =
    | {
          kind: 'treasury_preview'
          operation: 'transfer'
          amount: number
          from: TreasuryPreviewSide
          to: TreasuryPreviewSide
          status: 'pending' | 'superseded' | 'confirmed'
      }
    | {
          kind: 'treasury_preview'
          operation: 'adjust'
          account: { name: string; kind: string }
          balance: number
          target_balance: number
          /** target − saldo actual: positivo entra dinero, negativo sale. */
          difference: number
          reason: string
          status: 'pending' | 'superseded' | 'confirmed'
      }

/** Movimiento de saldo ya ejecutado, con los saldos que quedaron. */
export type TreasuryDoneCard =
    | {
          kind: 'treasury_done'
          operation: 'transfer'
          amount: number
          from: { name: string; balance: number }
          to: { name: string; balance: number }
      }
    | {
          kind: 'treasury_done'
          operation: 'adjust'
          account: { name: string }
          balance: number
          difference: number
      }

export type AssistantCard = SalePreviewCard | SaleCreatedCard | TreasuryPreviewCard | TreasuryDoneCard

/** Tarjetas que esperan el "sí" (el servidor guarda UNA pendiente por usuario). */
export type PreviewCard = SalePreviewCard | TreasuryPreviewCard

/** Lo que el servidor ve de una tarjeta cuando Place no escribió texto. */
export const CARD_ONLY_TURN = '(Se mostró la vista previa del pedido.)'

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

/** Ganancia/margen: solo llegan si el usuario puede verlos; si no, `null`. */
const optionalNumber = (value: unknown): number | null => (isFiniteNumber(value) ? value : null)

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null

const parseLine = (raw: unknown): SalePreviewLine | null => {
    const line = asRecord(raw)
    if (
        !line ||
        !isFiniteNumber(line.line) ||
        typeof line.product !== 'string' ||
        !isFiniteNumber(line.quantity) ||
        !isFiniteNumber(line.unit_price) ||
        !isFiniteNumber(line.total)
    ) {
        return null
    }
    return {
        line: line.line,
        product: line.product,
        size: typeof line.size === 'string' ? line.size : null,
        quantity: line.quantity,
        unit_price: line.unit_price,
        price_label: typeof line.price_label === 'string' ? line.price_label : '',
        total: line.total,
        profit: optionalNumber(line.profit),
        margin: optionalNumber(line.margin),
        note: typeof line.note === 'string' && line.note.trim().length > 0 ? line.note : null
    }
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

const parsePreviewSide = (raw: unknown): TreasuryPreviewSide | null => {
    const side = asRecord(raw)
    if (
        !side ||
        !isText(side.name) ||
        !isText(side.kind) ||
        !isFiniteNumber(side.balance) ||
        !isFiniteNumber(side.balance_after)
    ) {
        return null
    }
    return { name: side.name, kind: side.kind, balance: side.balance, balance_after: side.balance_after }
}

const parseDoneSide = (raw: unknown): { name: string; balance: number } | null => {
    const side = asRecord(raw)
    if (!side || !isText(side.name) || !isFiniteNumber(side.balance)) return null
    return { name: side.name, balance: side.balance }
}

const previewStatus = (raw: unknown): PreviewCard['status'] =>
    raw === 'superseded' || raw === 'confirmed' ? raw : 'pending'

/** Traslado (monto > 0) o corrección (diferencia ≠ 0, saldo final ≥ 0). */
const parseTreasuryPreview = (
    card: Record<string, unknown>,
    data: Record<string, unknown>
): AssistantCard | null => {
    const status = previewStatus(card.status)
    if (data.operation === 'transfer') {
        const from = parsePreviewSide(data.from)
        const to = parsePreviewSide(data.to)
        if (!from || !to || !isFiniteNumber(data.amount) || data.amount <= 0) return null
        return { kind: 'treasury_preview', operation: 'transfer', amount: data.amount, from, to, status }
    }
    if (data.operation === 'adjust') {
        const account = asRecord(data.account)
        if (
            !account ||
            !isText(account.name) ||
            !isText(account.kind) ||
            !isFiniteNumber(data.balance) ||
            !isFiniteNumber(data.target_balance) ||
            !isFiniteNumber(data.difference) ||
            data.difference === 0 ||
            data.target_balance < 0
        ) {
            return null
        }
        return {
            kind: 'treasury_preview',
            operation: 'adjust',
            account: { name: account.name, kind: account.kind },
            balance: data.balance,
            target_balance: data.target_balance,
            difference: data.difference,
            reason: typeof data.reason === 'string' ? data.reason : '',
            status
        }
    }
    return null
}

const parseTreasuryDone = (data: Record<string, unknown>): AssistantCard | null => {
    if (data.operation === 'transfer') {
        const from = parseDoneSide(data.from)
        const to = parseDoneSide(data.to)
        if (!from || !to || !isFiniteNumber(data.amount) || data.amount <= 0) return null
        return { kind: 'treasury_done', operation: 'transfer', amount: data.amount, from, to }
    }
    if (data.operation === 'adjust') {
        const account = asRecord(data.account)
        if (!account || !isText(account.name) || !isFiniteNumber(data.balance) || !isFiniteNumber(data.difference)) {
            return null
        }
        return {
            kind: 'treasury_done',
            operation: 'adjust',
            account: { name: account.name },
            balance: data.balance,
            difference: data.difference
        }
    }
    return null
}

/** Valida una tarjeta del stream (`{ kind, data }`) o ya guardada (aplanada). */
export const parseCard = (raw: unknown): AssistantCard | null => {
    const card = asRecord(raw)
    if (!card) return null
    const data = asRecord(card.data) ?? card

    if (card.kind === 'sale_preview') {
        if (typeof data.customer !== 'string' || !isFiniteNumber(data.total)) return null
        if (!Array.isArray(data.lines) || data.lines.length === 0) return null
        const lines = data.lines.map(parseLine)
        if (lines.some((line) => line === null)) return null
        return {
            kind: 'sale_preview',
            customer: data.customer,
            lines: lines as SalePreviewLine[],
            total: data.total,
            profit: optionalNumber(data.profit),
            margin: optionalNumber(data.margin),
            warnings: Array.isArray(data.warnings)
                ? data.warnings.filter((warning): warning is string => typeof warning === 'string')
                : [],
            status:
                card.status === 'superseded' || card.status === 'confirmed'
                    ? card.status
                    : 'pending'
        }
    }

    if (card.kind === 'sale_created') {
        if (
            typeof data.ticket_number !== 'string' ||
            typeof data.customer !== 'string' ||
            !isFiniteNumber(data.total)
        ) {
            return null
        }
        return {
            kind: 'sale_created',
            // Tarjetas guardadas antes de existir el id: no abren el visor.
            sale_id:
                isFiniteNumber(data.sale_id) && Number.isInteger(data.sale_id) && data.sale_id > 0
                    ? data.sale_id
                    : null,
            ticket_number: data.ticket_number,
            customer: data.customer,
            lines: isFiniteNumber(data.lines) ? data.lines : 0,
            total: data.total
        }
    }

    if (card.kind === 'treasury_preview') return parseTreasuryPreview(card, data)
    if (card.kind === 'treasury_done') return parseTreasuryDone(data)

    return null
}

/** "51,1%" — margen con un decimal, como el visor de tickets. */
export const formatMargin = (margin: number): string =>
    `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(margin)}%`

/** Valida una lista guardada; descarta lo que no sirva. */
export const parseCards = (raw: unknown): AssistantCard[] | undefined =>
    Array.isArray(raw)
        ? raw.map(parseCard).filter((card): card is AssistantCard => card !== null)
        : undefined

export const isPreviewCard = (card: AssistantCard): card is PreviewCard =>
    card.kind === 'sale_preview' || card.kind === 'treasury_preview'

/** Tarjeta de resultado → la vista previa que confirma. */
const CONFIRMS: Partial<Record<AssistantCard['kind'], PreviewCard['kind']>> = {
    sale_created: 'sale_preview',
    treasury_done: 'treasury_preview'
}

/**
 * Estado que deja una tarjeta nueva en una vista previa PENDIENTE anterior:
 *   - una vista previa nueva (de pedido o de tesorería) reemplaza a TODAS: el
 *     servidor guarda una sola por usuario;
 *   - un resultado confirma la pendiente de SU tipo; a las demás no las toca.
 * `null` = la pendiente sigue igual.
 */
export const settledStatus = (
    incoming: AssistantCard,
    pending: PreviewCard
): 'superseded' | 'confirmed' | null => {
    if (isPreviewCard(incoming)) return 'superseded'
    return CONFIRMS[incoming.kind] === pending.kind ? 'confirmed' : null
}
