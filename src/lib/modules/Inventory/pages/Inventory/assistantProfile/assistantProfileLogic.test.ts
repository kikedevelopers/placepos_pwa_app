import { describe, it, expect } from 'vitest'
import {
    EMPTY_PROFILE_FORM,
    PROFILE_LIMITS,
    RELATED_KIND_OPTIONS,
    addAttributeRow,
    addTags,
    applySuggestion,
    isProfileDirty,
    isProfileEmpty,
    removeAt,
    toProfileForm,
    updateAttribute,
    upsertRelated,
    validateProfileForm,
    diffSuggestion,
    countMarks,
    EMPTY_MARKS,
    type AssistantProfileForm
} from './assistantProfileLogic'

const form = (overrides: Partial<AssistantProfileForm> = {}): AssistantProfileForm => ({
    ...EMPTY_PROFILE_FORM,
    ...overrides
})

describe('toProfileForm', () => {
    it('toma lo guardado', () => {
        expect(
            toProfileForm({
                product_id: 5,
                description: 'Contenedor',
                uses: ['hamburguesa'],
                attributes: [{ name: 'compartimentos', value: '1' }],
                aliases: ['portacomida'],
                related: [{ product_id: 9, kind: 'upgrade', name: 'J2' }],
                updated_at: null
            })
        ).toEqual({
            description: 'Contenedor',
            uses: ['hamburguesa'],
            attributes: [{ name: 'compartimentos', value: '1' }],
            aliases: ['portacomida'],
            related: [{ product_id: 9, kind: 'upgrade', name: 'J2' }]
        })
    })

    it('sin datos (o servidor viejo) queda vacío', () => {
        expect(toProfileForm(null)).toEqual(EMPTY_PROFILE_FORM)
        expect(toProfileForm({ description: 'x' })).toEqual({ ...EMPTY_PROFILE_FORM, description: 'x' })
    })
})

describe('addTags', () => {
    it('acepta varias separadas por coma o salto de línea, recortadas', () => {
        expect(addTags([], ' hamburguesa con  papas , domicilio\nlonchera ')).toEqual([
            'hamburguesa con papas',
            'domicilio',
            'lonchera'
        ])
    })

    it('ignora vacías y repetidas sin importar mayúsculas', () => {
        expect(addTags(['Domicilio'], 'domicilio, ,DOMICILIO, asados')).toEqual(['Domicilio', 'asados'])
    })

    it('respeta el tope de la lista y el largo de cada etiqueta', () => {
        const full = Array.from({ length: PROFILE_LIMITS.listItems }, (_, i) => `t${i}`)
        expect(addTags(full, 'otra')).toHaveLength(PROFILE_LIMITS.listItems)
        expect(addTags([], 'x'.repeat(200))[0]).toHaveLength(PROFILE_LIMITS.tag)
    })

    it('no muta la lista original', () => {
        const current = ['a']
        addTags(current, 'b')
        expect(current).toEqual(['a'])
    })
})

describe('características', () => {
    it('agrega filas hasta el tope y las actualiza por índice', () => {
        let attributes = addAttributeRow([])
        attributes = updateAttribute(attributes, 0, { name: 'Material' })
        attributes = updateAttribute(attributes, 0, { value: 'icopor' })
        expect(attributes).toEqual([{ name: 'Material', value: 'icopor' }])
        const full = Array.from({ length: PROFILE_LIMITS.attributes }, () => ({ name: 'a', value: 'b' }))
        expect(addAttributeRow(full)).toHaveLength(PROFILE_LIMITS.attributes)
    })

    it('removeAt quita por índice', () => {
        expect(removeAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
    })
})

describe('upsertRelated', () => {
    const j2 = { product_id: 9, kind: 'upgrade' as const, name: 'J2' }

    it('agrega y, si ya estaba, cambia el tipo sin duplicar', () => {
        const once = upsertRelated([], j2, 5)
        const changed = upsertRelated(once, { ...j2, kind: 'alternative' }, 5)
        expect(changed).toEqual([{ ...j2, kind: 'alternative' }])
    })

    it('nunca se relaciona consigo mismo y respeta el tope', () => {
        expect(upsertRelated([], { ...j2, product_id: 5 }, 5)).toEqual([])
        const full = Array.from({ length: PROFILE_LIMITS.related }, (_, i) => ({ ...j2, product_id: i + 100 }))
        expect(upsertRelated(full, j2, 5)).toHaveLength(PROFILE_LIMITS.related)
    })

    it('ofrece los tres tipos de relación', () => {
        expect(RELATED_KIND_OPTIONS.map((o) => o.value)).toEqual(['upgrade', 'complement', 'alternative'])
    })
})

describe('applySuggestion', () => {
    const suggestion = {
        description: 'Contenedor de icopor con dos compartimentos',
        uses: ['hamburguesa con papas', 'domicilio'],
        attributes: [
            { name: 'Compartimentos', value: '2' },
            { name: 'Material', value: 'icopor' }
        ],
        aliases: ['portacomida']
    }

    it('con la ficha vacía, la llena completa', () => {
        expect(applySuggestion(EMPTY_PROFILE_FORM, suggestion)).toEqual({
            ...EMPTY_PROFILE_FORM,
            description: 'Contenedor de icopor con dos compartimentos',
            uses: ['hamburguesa con papas', 'domicilio'],
            attributes: suggestion.attributes,
            aliases: ['portacomida']
        })
    })

    it('NO borra lo que el dueño ya escribió', () => {
        const result = applySuggestion(
            form({
                description: 'Mi descripción',
                uses: ['Domicilio'],
                attributes: [{ name: 'material', value: 'cartón' }],
                related: [{ product_id: 9, kind: 'upgrade', name: 'J2' }]
            }),
            suggestion
        )
        expect(result.description).toBe('Mi descripción')
        expect(result.uses).toEqual(['Domicilio', 'hamburguesa con papas'])
        expect(result.attributes).toEqual([
            { name: 'material', value: 'cartón' },
            { name: 'Compartimentos', value: '2' }
        ])
        expect(result.related).toHaveLength(1)
    })

    it('tolera una propuesta incompleta', () => {
        const result = applySuggestion(EMPTY_PROFILE_FORM, { description: 'x' } as never)
        expect(result).toEqual({ ...EMPTY_PROFILE_FORM, description: 'x' })
    })
})

describe('validateProfileForm', () => {
    it('arma el payload: recorta, descarta filas vacías y deja solo id+tipo en relacionados', () => {
        const result = validateProfileForm(
            form({
                description: '  Contenedor  ',
                uses: ['hamburguesa'],
                attributes: [
                    { name: ' Compartimentos ', value: ' 2 ' },
                    { name: '', value: '' }
                ],
                related: [{ product_id: 9, kind: 'upgrade', name: 'J2' }]
            })
        )
        expect(result).toEqual({
            ok: true,
            payload: {
                description: 'Contenedor',
                uses: ['hamburguesa'],
                attributes: [{ name: 'Compartimentos', value: '2' }],
                aliases: [],
                related: [{ product_id: 9, kind: 'upgrade' }]
            }
        })
    })

    it('una característica a medias es un error', () => {
        for (const attribute of [
            { name: 'Material', value: '' },
            { name: '', value: 'icopor' }
        ]) {
            const result = validateProfileForm(form({ attributes: [attribute] }))
            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.errors.attributes).toBeTruthy()
        }
    })

    it('descripción demasiado larga es un error', () => {
        const result = validateProfileForm(form({ description: 'x'.repeat(PROFILE_LIMITS.description + 1) }))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.description).toBeTruthy()
    })

    it('una ficha vacía es válida (se puede guardar para limpiarla)', () => {
        expect(validateProfileForm(EMPTY_PROFILE_FORM).ok).toBe(true)
    })
})

describe('isProfileDirty / isProfileEmpty', () => {
    it('detecta cambios reales e ignora espacios o filas vacías', () => {
        const saved = form({ description: 'Contenedor' })
        expect(isProfileDirty(form({ description: 'Contenedor  ' }), saved)).toBe(false)
        expect(isProfileDirty(form({ description: 'Contenedor', attributes: [{ name: '', value: '' }] }), saved)).toBe(false)
        expect(isProfileDirty(form({ description: 'Otro' }), saved)).toBe(true)
        expect(isProfileDirty(form({ description: 'Contenedor', attributes: [{ name: 'a', value: '' }] }), saved)).toBe(true)
    })

    it('ficha vacía: nada escrito (filas vacías no cuentan)', () => {
        expect(isProfileEmpty(form({ attributes: [{ name: ' ', value: '' }] }))).toBe(true)
        expect(isProfileEmpty(form({ aliases: ['x'] }))).toBe(false)
    })
})

describe('diffSuggestion / countMarks', () => {
    it('marca solo lo que agregó la IA (sin importar mayúsculas)', () => {
        const before = form({
            description: '',
            uses: ['Domicilio'],
            attributes: [{ name: 'Material', value: 'cartón' }],
            aliases: []
        })
        const after = form({
            description: 'Propuesta',
            uses: ['Domicilio', 'Asados'],
            attributes: [
                { name: 'Material', value: 'cartón' },
                { name: 'Sabor', value: 'Picante' }
            ],
            aliases: ['chile en polvo']
        })
        const marks = diffSuggestion(before, after)
        expect(marks.description).toBe(true)
        expect([...marks.uses]).toEqual(['asados'])
        expect([...marks.attributes]).toEqual(['sabor'])
        expect([...marks.aliases]).toEqual(['chile en polvo'])
        expect(countMarks(marks)).toBe(4)
    })

    it('si la descripción ya existía no se marca', () => {
        const marks = diffSuggestion(form({ description: 'Mía' }), form({ description: 'Mía' }))
        expect(marks.description).toBe(false)
        expect(countMarks(marks)).toBe(0)
    })

    it('las marcas vacías no cuentan nada', () => {
        expect(countMarks(EMPTY_MARKS)).toBe(0)
    })
})
