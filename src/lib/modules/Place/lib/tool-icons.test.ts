import { describe, it, expect } from 'vitest'
import Archive from '@lucide/svelte/icons/archive'
import CircleCheck from '@lucide/svelte/icons/circle-check'
import CirclePlus from '@lucide/svelte/icons/circle-plus'
import Database from '@lucide/svelte/icons/database'
import Landmark from '@lucide/svelte/icons/landmark'
import ShoppingCart from '@lucide/svelte/icons/shopping-cart'
import { describeToolIcon } from './tool-icons'

describe('describeToolIcon', () => {
    it('las herramientas de gastos de Place tienen su propio ícono', () => {
        expect(describeToolIcon('register_expense')).toBe(CirclePlus)
        expect(describeToolIcon('void_expense')).toBe(Archive)
        expect(describeToolIcon('confirm_expense_action')).toBe(CircleCheck)
    })

    it('las herramientas de pedidos de Place tienen su propio ícono', () => {
        expect(describeToolIcon('prepare_sale')).toBe(ShoppingCart)
        expect(describeToolIcon('confirm_sale')).toBe(CircleCheck)
    })

    it('mantiene las herramientas de consulta', () => {
        expect(describeToolIcon('get_treasury_accounts')).toBe(Landmark)
    })

    it('una herramienta desconocida cae al ícono genérico', () => {
        expect(describeToolIcon('herramienta_nueva')).toBe(Database)
        expect(describeToolIcon('')).toBe(Database)
    })
})
