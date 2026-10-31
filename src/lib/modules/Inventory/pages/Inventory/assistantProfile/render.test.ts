import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import TagInput from './TagInput.svelte'
import AttributesEditor from './AttributesEditor.svelte'
import AssistantProfileEntry from './AssistantProfileEntry.svelte'
import { PROFILE_LIMITS } from './assistantProfileLogic'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('TagInput', () => {
    it('muestra las etiquetas, cada una con su botón de quitar, y marca las de la IA', () => {
        const out = html(TagInput, {
            id: 'u',
            tags: ['hamburguesa', 'domicilio'],
            placeholder: 'Ej',
            suggested: new Set(['domicilio']),
            onChange: () => {}
        })
        expect(out).toContain('Quitar hamburguesa')
        expect(out).toContain('Quitar domicilio')
        expect(out.match(/Propuesto por la IA/g)).toHaveLength(1)
        expect(out).toContain('Agregar otro…')
    })

    it('llena: ya no ofrece agregar', () => {
        const tags = Array.from({ length: PROFILE_LIMITS.listItems }, (_, i) => `t${i}`)
        expect(html(TagInput, { id: 'u', tags, placeholder: 'Ej', suggested: new Set(), onChange: () => {} })).not.toContain(
            'aria-label="Agregar"'
        )
    })
})

describe('AttributesEditor', () => {
    it('una fila por característica, error visible y botón para agregar', () => {
        const out = html(AttributesEditor, {
            attributes: [{ name: 'Compartimentos', value: '2' }],
            suggested: new Set(),
            error: 'Cada característica necesita nombre y valor',
            onChange: () => {}
        })
        expect(out).toContain('value="Compartimentos"')
        expect(out).toContain('value="2"')
        expect(text(out)).toContain('Cada característica necesita nombre y valor')
        expect(text(out)).toContain('Agregar característica')
    })

    it('en el tope no deja agregar más', () => {
        const attributes = Array.from({ length: PROFILE_LIMITS.attributes }, (_, i) => ({ name: `a${i}`, value: 'v' }))
        expect(text(html(AttributesEditor, { attributes, suggested: new Set(), onChange: () => {} }))).not.toContain(
            'Agregar característica'
        )
    })
})

describe('AssistantProfileEntry', () => {
    it('desde una presentación aclara que la ficha es del base', () => {
        expect(text(html(AssistantProfileEntry, { onclick: () => {} }))).toContain('El agente la usa para vender')
        expect(text(html(AssistantProfileEntry, { fromPresentation: true, onclick: () => {} }))).toContain(
            'Es la del producto base'
        )
    })
})
