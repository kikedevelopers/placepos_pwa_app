import { describe, expect, it } from 'vitest'
import type { PurchaseCredit } from '$lib/api/requests/purchases'
import {
    deliveryPill,
    hasPendingBalance,
    paymentPill,
    purchaseBalance,
    purchasePaid
} from './purchaseSummary'
import {
    abonoExceedsBalance,
    canSubmitAbono,
    canSubmitReceive,
    receivedAtISO,
    splitSourceKey
} from './purchaseActions'

const credit = (over: Partial<PurchaseCredit> = {}): PurchaseCredit => ({
    id: 1,
    total_amount: 1000,
    paid_amount: 0,
    balance: 1000,
    status: 'PENDING',
    ...over
})

describe('purchaseSummary · deliveryPill', () => {
    it('RECEIVED → Recibida/success', () => {
        expect(deliveryPill('RECEIVED')).toEqual({ label: 'Recibida', tone: 'success' })
    })
    it('PENDING → Pendiente/warning', () => {
        expect(deliveryPill('PENDING')).toEqual({ label: 'Pendiente', tone: 'warning' })
    })
})

describe('purchaseSummary · paymentPill', () => {
    it('sin crédito → Pagada', () => {
        expect(paymentPill(null)).toEqual({ label: 'Pagada', tone: 'success' })
    })
    it('balance 0 aunque status no sea PAID → Pagada', () => {
        expect(paymentPill(credit({ balance: 0, status: 'PENDING' }))).toEqual({
            label: 'Pagada',
            tone: 'success'
        })
    })
    it('balance negativo (sobrepago) → Pagada', () => {
        expect(paymentPill(credit({ balance: -50 }))).toEqual({
            label: 'Pagada',
            tone: 'success'
        })
    })
    it('PARTIALLY_PAID con saldo → Abono parcial/warning', () => {
        expect(paymentPill(credit({ balance: 400, paid_amount: 600, status: 'PARTIALLY_PAID' }))).toEqual(
            { label: 'Abono parcial', tone: 'warning' }
        )
    })
    it('PENDING con saldo → Por pagar/danger', () => {
        expect(paymentPill(credit({ balance: 1000, status: 'PENDING' }))).toEqual({
            label: 'Por pagar',
            tone: 'danger'
        })
    })
})

describe('purchaseSummary · balance / paid / pending', () => {
    it('purchaseBalance devuelve el balance o 0 sin crédito', () => {
        expect(purchaseBalance(credit({ balance: 250 }))).toBe(250)
        expect(purchaseBalance(null)).toBe(0)
    })
    it('purchasePaid usa paid_amount; sin crédito asume el total (contado)', () => {
        expect(purchasePaid(credit({ paid_amount: 300 }), 1000)).toBe(300)
        expect(purchasePaid(null, 1000)).toBe(1000)
    })
    it('hasPendingBalance true solo con saldo > 0', () => {
        expect(hasPendingBalance(credit({ balance: 1 }))).toBe(true)
        expect(hasPendingBalance(credit({ balance: 0 }))).toBe(false)
        expect(hasPendingBalance(null)).toBe(false)
    })
})

describe('purchaseActions · splitSourceKey', () => {
    it('descompone tipo compuesto (cash_register) e id', () => {
        expect(splitSourceKey('cash_register-7')).toEqual({
            source_type: 'cash_register',
            source_id: 7
        })
    })
    it('descompone wallet y bank', () => {
        expect(splitSourceKey('wallet-3')).toEqual({ source_type: 'wallet', source_id: 3 })
        expect(splitSourceKey('bank-12')).toEqual({ source_type: 'bank', source_id: 12 })
    })
})

describe('purchaseActions · abonoExceedsBalance', () => {
    it('permite abonar exactamente el saldo', () => {
        expect(abonoExceedsBalance(1000, 1000)).toBe(false)
    })
    it('bloquea abonar por encima del saldo', () => {
        expect(abonoExceedsBalance(1000.01, 1000)).toBe(true)
    })
    it('redondea el saldo a 2 decimales para tolerar ruido de coma flotante', () => {
        // Un saldo con ruido (100.004) se redondea a 100 → abonar 100 no excede.
        expect(abonoExceedsBalance(100, 100.004)).toBe(false)
        expect(abonoExceedsBalance(100.02, 100)).toBe(true)
    })
})

describe('purchaseActions · canSubmitAbono', () => {
    const base = { amount: 500, balance: 1000, sourceKey: 'bank-1', pending: false }
    it('happy path: monto válido, fuente y sin request en curso', () => {
        expect(canSubmitAbono(base)).toBe(true)
    })
    it('falla sin fuente seleccionada', () => {
        expect(canSubmitAbono({ ...base, sourceKey: '' })).toBe(false)
    })
    it('falla con monto 0 o negativo', () => {
        expect(canSubmitAbono({ ...base, amount: 0 })).toBe(false)
        expect(canSubmitAbono({ ...base, amount: -10 })).toBe(false)
    })
    it('falla si el monto excede el saldo', () => {
        expect(canSubmitAbono({ ...base, amount: 1001 })).toBe(false)
    })
    it('falla si hay una petición en curso', () => {
        expect(canSubmitAbono({ ...base, pending: true })).toBe(false)
    })
})

describe('purchaseActions · receivedAtISO', () => {
    it('fija las 12:00 locales y produce ISO estable (sin salto de día)', () => {
        const iso = receivedAtISO('2026-07-13')
        // El día local debe conservarse independientemente del huso.
        expect(new Date(iso).getDate()).toBe(13)
        expect(new Date(iso).getHours()).toBe(12)
        expect(iso.endsWith('Z')).toBe(true)
    })
})

describe('purchaseActions · canSubmitReceive', () => {
    it('happy path: receptor y fecha presentes', () => {
        expect(canSubmitReceive('Enrique Pacheco', '2026-07-13')).toBe(true)
    })
    it('falla con receptor vacío o solo espacios', () => {
        expect(canSubmitReceive('', '2026-07-13')).toBe(false)
        expect(canSubmitReceive('   ', '2026-07-13')).toBe(false)
    })
    it('falla sin fecha', () => {
        expect(canSubmitReceive('Enrique', '')).toBe(false)
    })
})
