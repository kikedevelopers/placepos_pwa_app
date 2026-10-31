import type {
    AssistantProfile,
    AssistantProfileSuggestion,
    ProductAttribute,
    RelatedKind,
    RelatedProduct,
    UpdateAssistantProfilePayload
} from '$lib/api/requests/productAssistant'

/**
 * Lógica pura de la ficha "Para el asistente" (sin React) para poder testearla.
 * Los topes coinciden con los de pos_api (`catalog-knowledge/internal/profile`).
 */

export const PROFILE_LIMITS = {
    description: 1000,
    listItems: 15,
    tag: 60,
    attributes: 15,
    attributeName: 40,
    attributeValue: 80,
    related: 10
} as const

export interface AssistantProfileForm {
    description: string
    uses: string[]
    attributes: ProductAttribute[]
    aliases: string[]
    related: RelatedProduct[]
}

export interface AssistantProfileErrors {
    description?: string
    attributes?: string
}

export const EMPTY_PROFILE_FORM: AssistantProfileForm = {
    description: '',
    uses: [],
    attributes: [],
    aliases: [],
    related: []
}

export const RELATED_KIND_OPTIONS: ReadonlyArray<{
    value: RelatedKind
    label: string
    hint: string
}> = [
    {
        value: 'upgrade',
        label: 'Versión superior',
        hint: 'Más completo o más grande: lo ofrece si el cliente necesita más.'
    },
    {
        value: 'complement',
        label: 'Complemento',
        hint: 'Se lleva junto con este (venta cruzada).'
    },
    {
        value: 'alternative',
        label: 'Alternativa',
        hint: 'Sirve para lo mismo: lo ofrece si este no le convence.'
    }
] as const

/** Estado inicial desde lo guardado (tolera campos ausentes por version skew). */
export const toProfileForm = (profile: Partial<AssistantProfile> | null | undefined): AssistantProfileForm => ({
    description: profile?.description ?? '',
    uses: profile?.uses ?? [],
    attributes: profile?.attributes ?? [],
    aliases: profile?.aliases ?? [],
    related: profile?.related ?? []
})

const cleanTag = (value: string): string =>
    value.replace(/\s+/g, ' ').trim().slice(0, PROFILE_LIMITS.tag)

/**
 * Agrega etiquetas escritas por el usuario. Acepta varias separadas por coma o
 * salto de línea. Ignora vacías y repetidas (sin importar mayúsculas) y respeta
 * el tope de la lista.
 */
export const addTags = (current: readonly string[], raw: string): string[] => {
    const next = [...current]
    const seen = new Set(current.map((tag) => tag.toLowerCase()))
    for (const piece of raw.split(/[,\n]/)) {
        const tag = cleanTag(piece)
        if (!tag || seen.has(tag.toLowerCase())) continue
        if (next.length >= PROFILE_LIMITS.listItems) break
        seen.add(tag.toLowerCase())
        next.push(tag)
    }
    return next
}

export const removeAt = <T>(list: readonly T[], index: number): T[] =>
    list.filter((_, i) => i !== index)

/** Agrega una fila vacía de característica (si no se llegó al tope). */
export const addAttributeRow = (attributes: readonly ProductAttribute[]): ProductAttribute[] =>
    attributes.length >= PROFILE_LIMITS.attributes
        ? [...attributes]
        : [...attributes, { name: '', value: '' }]

export const updateAttribute = (
    attributes: readonly ProductAttribute[],
    index: number,
    patch: Partial<ProductAttribute>
): ProductAttribute[] =>
    attributes.map((attribute, i) => (i === index ? { ...attribute, ...patch } : attribute))

/** Agrega (o cambia el tipo de) un producto relacionado. Nunca el mismo producto. */
export const upsertRelated = (
    related: readonly RelatedProduct[],
    item: RelatedProduct,
    selfId: number | null
): RelatedProduct[] => {
    if (item.product_id === selfId) return [...related]
    const index = related.findIndex((r) => r.product_id === item.product_id)
    if (index >= 0) {
        return related.map((r, i) => (i === index ? item : r))
    }
    if (related.length >= PROFILE_LIMITS.related) return [...related]
    return [...related, item]
}

/**
 * Mezcla la propuesta de la IA SIN borrar lo que el dueño ya escribió: la
 * descripción solo se llena si está vacía; las listas se unen; las
 * características se agregan solo si no existe una con ese nombre.
 */
export const applySuggestion = (
    form: AssistantProfileForm,
    suggestion: AssistantProfileSuggestion
): AssistantProfileForm => {
    const names = new Set(form.attributes.map((a) => a.name.trim().toLowerCase()))
    const attributes = [...form.attributes]
    for (const attribute of suggestion.attributes ?? []) {
        const key = attribute.name.trim().toLowerCase()
        if (!key || names.has(key) || attributes.length >= PROFILE_LIMITS.attributes) continue
        names.add(key)
        attributes.push({ name: attribute.name.trim(), value: attribute.value.trim() })
    }
    return {
        ...form,
        description: form.description.trim() ? form.description : (suggestion.description ?? '').trim(),
        uses: addTags(form.uses, (suggestion.uses ?? []).join(',')),
        aliases: addTags(form.aliases, (suggestion.aliases ?? []).join(',')),
        attributes
    }
}

export type ValidationResult =
    | { ok: true; payload: UpdateAssistantProfilePayload }
    | { ok: false; errors: AssistantProfileErrors }

/**
 * Valida y arma el payload. Las filas de características totalmente vacías se
 * descartan; una a medias (nombre sin valor o al revés) es un error.
 */
export const validateProfileForm = (form: AssistantProfileForm): ValidationResult => {
    const errors: AssistantProfileErrors = {}
    const description = form.description.trim()
    if (description.length > PROFILE_LIMITS.description) {
        errors.description = `La descripción no puede superar ${PROFILE_LIMITS.description} caracteres.`
    }

    const attributes: ProductAttribute[] = []
    for (const attribute of form.attributes) {
        const name = attribute.name.trim()
        const value = attribute.value.trim()
        if (!name && !value) continue
        if (!name || !value) {
            errors.attributes = 'Cada característica necesita nombre y valor (ej. "Compartimentos: 2").'
            continue
        }
        attributes.push({
            name: name.slice(0, PROFILE_LIMITS.attributeName),
            value: value.slice(0, PROFILE_LIMITS.attributeValue)
        })
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors }

    return {
        ok: true,
        payload: {
            description,
            uses: form.uses,
            attributes,
            aliases: form.aliases,
            related: form.related.map(({ product_id, kind }) => ({ product_id, kind }))
        }
    }
}

/** `true` si el formulario difiere de lo guardado. */
export const isProfileDirty = (form: AssistantProfileForm, saved: AssistantProfileForm): boolean => {
    const a = validateProfileForm(form)
    const b = validateProfileForm(saved)
    if (!a.ok || !b.ok) return true
    return JSON.stringify(a.payload) !== JSON.stringify(b.payload)
}

/** `true` si la ficha no tiene nada (el asistente solo conoce el nombre). */
export const isProfileEmpty = (form: AssistantProfileForm): boolean =>
    !form.description.trim() &&
    form.uses.length === 0 &&
    form.attributes.every((a) => !a.name.trim() && !a.value.trim()) &&
    form.aliases.length === 0 &&
    form.related.length === 0

/** Lo que agregó la IA en una mezcla (para resaltarlo hasta que se guarde). */
export interface SuggestedMarks {
    description: boolean
    uses: Set<string>
    aliases: Set<string>
    /** Nombres de características (en minúscula). */
    attributes: Set<string>
}

export const EMPTY_MARKS: SuggestedMarks = {
    description: false,
    uses: new Set(),
    aliases: new Set(),
    attributes: new Set()
}

const lower = (values: readonly string[]): Set<string> => new Set(values.map((v) => v.toLowerCase()))

/** Diferencia entre la ficha antes y después de aplicar la propuesta. */
export const diffSuggestion = (
    before: AssistantProfileForm,
    after: AssistantProfileForm
): SuggestedMarks => {
    const usesBefore = lower(before.uses)
    const aliasesBefore = lower(before.aliases)
    const attributesBefore = lower(before.attributes.map((a) => a.name.trim()))
    return {
        description: before.description.trim() === '' && after.description.trim() !== '',
        uses: new Set(after.uses.filter((u) => !usesBefore.has(u.toLowerCase())).map((u) => u.toLowerCase())),
        aliases: new Set(
            after.aliases.filter((a) => !aliasesBefore.has(a.toLowerCase())).map((a) => a.toLowerCase())
        ),
        attributes: new Set(
            after.attributes
                .map((a) => a.name.trim().toLowerCase())
                .filter((name) => name && !attributesBefore.has(name))
        )
    }
}

/** Cuántos elementos propuso la IA (para el aviso "La IA agregó N…"). */
export const countMarks = (marks: SuggestedMarks): number =>
    (marks.description ? 1 : 0) + marks.uses.size + marks.aliases.size + marks.attributes.size

/** Sin tildes y en minúscula, para buscar ("cafe" encuentra "Café"). */
const normalizeText = (text: string): string =>
    text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()

export interface RelatedCandidate {
    id: number
    name: string
    isPresentation: boolean
}

/**
 * Productos que se pueden relacionar: activos, distintos al de la ficha y no
 * agregados ya; filtrados por el texto buscado (sin tildes). Máximo `max`.
 */
export const relatedCandidates = (
    products: ReadonlyArray<{ id: number; name: string; parent_id: number | null; archived?: boolean }>,
    search: string,
    selfId: number,
    related: readonly RelatedProduct[],
    max = 8
): RelatedCandidate[] => {
    const term = normalizeText(search.trim())
    if (!term) return []
    const taken = new Set(related.map((r) => r.product_id))
    return products
        .filter((p) => !p.archived && p.id !== selfId && !taken.has(p.id))
        .filter((p) => normalizeText(p.name).includes(term))
        .slice(0, max)
        .map((p) => ({ id: p.id, name: p.name, isPresentation: p.parent_id !== null }))
}
