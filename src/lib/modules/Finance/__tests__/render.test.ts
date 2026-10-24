import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import { Landmark, Wallet } from '@lucide/svelte'
import AccountCard from '../components/AccountCard.svelte'
import AccountActions from '../components/AccountActions.svelte'
import AccountCarousel from '../components/AccountCarousel.svelte'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('AccountCard', () => {
    it('banco: azul marino, saldo protagonista e insignia POS', () => {
        const body = html(AccountCard, { kind: 'bank', icon: Landmark, name: 'NU BANK', subtitle: 'Ahorro · @EPV173', balance: 2738000, badge: 'POS' })
        expect(body).toContain('#0b1d45')
        expect(text(body)).toContain('NU BANK')
        expect(text(body)).toContain('2.738.000')
        expect(text(body)).toContain('POS')
    })

    it('billetera: verde petróleo y sin insignia', () => {
        const body = html(AccountCard, { kind: 'wallet', icon: Wallet, name: 'CAJA CHICA', subtitle: 'Billetera', balance: 10281606.5 })
        expect(body).toContain('#052e2b')
        expect(text(body)).not.toContain('POS')
    })
})

describe('AccountCarousel', () => {
    const accounts = [
        { id: 1, name: 'CAJA CHICA', subtitle: 'Billetera', balance: 100 },
        { id: 2, name: 'CAJA MAYOR', subtitle: 'Billetera', balance: 200 }
    ]

    it('varias cuentas: carrusel con encaje y un punto por cuenta, activo el elegido', () => {
        const body = html(AccountCarousel, { kind: 'wallet', icon: Wallet, accounts, selectedId: 2, onSelect: () => {} })
        expect(body).toContain('snap-mandatory')
        expect(body.match(/role="tab"/g)).toHaveLength(2)
        expect(body).toMatch(/aria-selected="true"[^>]*aria-label="CAJA MAYOR"/)
    })

    it('una sola cuenta: tarjeta a todo el ancho, sin puntos', () => {
        const body = html(AccountCarousel, { kind: 'wallet', icon: Wallet, accounts: accounts.slice(0, 1), selectedId: 1, onSelect: () => {} })
        expect(body).not.toContain('snap-mandatory')
        expect(body).not.toContain('role="tab"')
    })
})

describe('AccountActions — por rol', () => {
    const noop = () => {}
    const run = (canManage: boolean, canAdjust: boolean) =>
        text(html(AccountActions, { canManage, canAdjust, onTransfer: noop, onAdjust: noop, onEdit: noop }))

    it('dueño: mover, corregir y editar', () => {
        const t = run(true, true)
        expect(t).toContain('Mover saldo')
        expect(t).toContain('Corregir')
        expect(t).toContain('Editar')
    })

    it('administrador sin ajuste: no puede corregir', () => {
        const t = run(true, false)
        expect(t).toContain('Mover saldo')
        expect(t).not.toContain('Corregir')
    })

    it('sin permisos no pinta nada', () => {
        expect(run(false, false).trim()).toBe('')
    })
})
