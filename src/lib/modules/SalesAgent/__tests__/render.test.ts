import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import ChoiceCard from '../components/ChoiceCard.svelte'
import TextInput from '../components/TextInput.svelte'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body

describe('ChoiceCard', () => {
    it('expone el estado elegido a lectores de pantalla', () => {
        const on = html(ChoiceCard, { role: 'radio', checked: true, label: 'Efectivo', onclick: () => {} })
        const off = html(ChoiceCard, { role: 'checkbox', checked: false, label: 'Tarjeta', onclick: () => {} })
        expect(on).toContain('role="radio"')
        expect(on).toContain('aria-checked="true"')
        expect(off).toContain('role="checkbox"')
        expect(off).toContain('aria-checked="false"')
    })

    it('muestra la descripción', () => {
        expect(
            html(ChoiceCard, { role: 'radio', checked: false, label: 'Avisar', description: 'Lo dice y ofrece otra', onclick: () => {} })
        ).toContain('Lo dice y ofrece otra')
    })
})

describe('TextInput', () => {
    it('etiqueta enlazada, contador y ayuda', () => {
        const out = html(TextInput, { id: 'n', label: 'Nombre', value: 'Gysell', maxlength: 60, hint: 'Así se presenta' })
        expect(out).toContain('for="n"')
        expect(out).toContain('6/60')
        expect(out).toContain('Así se presenta')
        expect(out).not.toContain('aria-invalid')
    })

    it('con error: lo anuncia y reemplaza la ayuda', () => {
        const out = html(TextInput, { id: 'n', label: 'Nombre', value: '', hint: 'Ayuda', error: 'Ponle un nombre' })
        expect(out).toContain('aria-invalid="true"')
        expect(out).toContain('role="alert"')
        expect(out).toContain('Ponle un nombre')
        expect(out).not.toContain('Ayuda')
    })

    it('multilínea usa textarea', () => {
        expect(html(TextInput, { id: 's', label: 'Saludo', value: '', multiline: true })).toContain('<textarea')
    })
})
