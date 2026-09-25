import { describe, it, expect } from 'vitest'
import type { AccountTransferDestination } from '$lib/api/requests/accounts'
import {
    buildDestinationValue,
    parseDestinationValue,
    findDestination,
    groupDestinations
} from './transferDestinations'

const selfWallet: AccountTransferDestination = {
    id: 1,
    name: 'Efectivo',
    balance: 100,
    type: 'wallet',
    scope: 'self'
}
const selfBank: AccountTransferDestination = {
    id: 2,
    name: 'Banco Sucursal',
    balance: 50,
    type: 'bank',
    scope: 'self'
}
const selfUser: AccountTransferDestination = {
    id: 3,
    name: 'Cajero Juan',
    balance: 10,
    type: 'user',
    scope: 'self'
}
// Colisión intencional de id (2) entre banco propio y banco del principal.
const mainBank: AccountTransferDestination = {
    id: 2,
    name: 'Bancolombia Principal',
    balance: 900,
    type: 'bank',
    scope: 'main',
    company_name: 'Esencia & Granos'
}
const mainWallet: AccountTransferDestination = {
    id: 11,
    name: 'Efectivo Principal',
    balance: 500,
    type: 'wallet',
    scope: 'main',
    company_name: 'Esencia & Granos'
}
const legacyWallet: AccountTransferDestination = {
    id: 7,
    name: 'Billetera Legacy',
    balance: 5,
    type: 'wallet'
}

describe('buildDestinationValue / parseDestinationValue', () => {
    it('build y parse son inversos', () => {
        const value = buildDestinationValue('main', 'bank', 12)
        expect(value).toBe('main|bank|12')
        expect(parseDestinationValue(value)).toEqual({ scope: 'main', type: 'bank', id: 12 })
    })

    it('parse devuelve null ante formato inválido', () => {
        expect(parseDestinationValue('')).toBeNull()
        expect(parseDestinationValue('bank:2')).toBeNull()
        expect(parseDestinationValue('self|bank')).toBeNull()
        expect(parseDestinationValue('self|bank|abc')).toBeNull()
    })
})

describe('findDestination', () => {
    const destinations = [selfWallet, selfBank, selfUser, mainBank, mainWallet]

    it('distingue banco propio y del principal con el mismo id según el scope', () => {
        expect(findDestination(destinations, 'self|bank|2')).toBe(selfBank)
        expect(findDestination(destinations, 'main|bank|2')).toBe(mainBank)
    })

    it('encuentra destino del principal', () => {
        expect(findDestination(destinations, 'main|wallet|11')).toBe(mainWallet)
    })

    it('trata un destino sin scope como self', () => {
        expect(findDestination([legacyWallet], 'self|wallet|7')).toBe(legacyWallet)
    })

    it('devuelve null si no hay match o value inválido', () => {
        expect(findDestination(destinations, 'self|bank|999')).toBeNull()
        expect(findDestination(destinations, 'garbage')).toBeNull()
    })
})

describe('groupDestinations', () => {
    it('separa propios por tipo y agrupa los del principal', () => {
        const grouped = groupDestinations([
            selfWallet,
            selfBank,
            selfUser,
            mainBank,
            mainWallet,
            legacyWallet
        ])

        expect(grouped.wallets).toEqual([selfWallet, legacyWallet])
        expect(grouped.banks).toEqual([selfBank])
        expect(grouped.users).toEqual([selfUser])
        expect(grouped.main).toEqual([mainBank, mainWallet])
        expect(grouped.mainCompanyName).toBe('Esencia & Granos')
    })

    it('sin destinos del principal: main vacío y nombre por defecto', () => {
        const grouped = groupDestinations([selfWallet, selfBank])
        expect(grouped.main).toEqual([])
        expect(grouped.mainCompanyName).toBe('Negocio Principal')
    })

    it('lista vacía no rompe', () => {
        const grouped = groupDestinations([])
        expect(grouped.wallets).toEqual([])
        expect(grouped.main).toEqual([])
    })
})
