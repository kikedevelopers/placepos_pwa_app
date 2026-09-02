import { fromStore } from 'svelte/store'
import { toast } from 'svelte-sonner'
import Big from 'big.js'
import type { ZodError } from 'zod'
import type { Product, ProductPayload, ProductPricePayload } from '$lib/api/requests/products'
import { getErrorMessage } from '$lib/utils/errors'
import {
    presentationSchema,
    type PresentationFormData,
    type PricingMode
} from '../schemas/presentation.schema'
import {
    computePresentationRemainder,
    computePresentationStock
} from '../utils/presentationStock'
import { computeCalculatedCost, computeFromPriceValue } from '../utils/presentationMath'
import { usePackagings } from './useCatalogs'
import { useProductImage } from './useProductImage.svelte'
import { useProducts } from './useProducts'
import { useProductMutations } from './useProductMutations'

Big.DP = 10
Big.RM = Big.roundHalfUp

const MAX_PRICES = 4
const round2 = (n: number): number => Number(new Big(Number.isFinite(n) ? n : 0).round(2).toString())
const maxPrice = (prices: { sale_price?: number }[]): number =>
    prices.reduce((m, p) => Math.max(m, p.sale_price ?? 0), 0)

const toDefaults = (p: Product | null): PresentationFormData => ({
    name: p?.name ?? '',
    sku_code: p?.sku_code ?? '',
    bar_code: p?.bar_code ?? '',
    description: p?.description ?? '',
    parent_id: p?.parent_id ?? 0,
    show_in_pos: p?.show_in_pos ?? true,
    // Al editar, si tiene empaque asignado lo mostramos como "empaque fijo"; si no,
    // "peso variable" con el value del empaque auto embebido.
    pricing_mode: p?.packaging_id ? 'packaging' : p?.packaging ? 'quantity' : 'packaging',
    packaging_id: p?.packaging_id ?? null,
    packaging_value: p?.packaging_id ? 0 : (p?.packaging?.value ?? 0),
    prices: p?.prices?.length
        ? p.prices.map((pr) => ({
              id: pr.id,
              sale_price: pr.sale_price,
              profit: pr.profit,
              margin: pr.margin
          }))
        : [{ sale_price: 0, profit: 0, margin: 0 }]
})

const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/**
 * Controlador del formulario de PRESENTACIÓN (producto hijo), espejo de
 * `placepos: ProductVariantForm/hooks/useVariantForm.ts` adaptado a runes.
 */
export function usePresentationForm(presentation: Product | null, onSuccess: () => void) {
    const { create, update } = useProductMutations()
    const c = fromStore(create)
    const u = fromStore(update)
    const productsQuery = fromStore(useProducts())
    const packagingsQuery = fromStore(usePackagings())
    // La imagen NO viaja en el payload del producto: es un archivo que se sube
    // aparte, contra el id del item, así que en creación hay que esperar a
    // tenerlo (ver `submit`).
    const image = useProductImage({
        imagePath: presentation?.image,
        currentUrl: presentation?.image_url
    })

    const form = $state<PresentationFormData>(toDefaults(presentation))
    let attempted = $state(false)
    let submitError = $state('')
    const isEdit = !!presentation

    const products = $derived(productsQuery.current.data ?? [])
    const packagings = $derived(packagingsQuery.current.data ?? [])

    // Productos base elegibles como padre: sin parent y CON empaque (se necesita
    // su packaging.value para derivar costo/stock de la presentación).
    const parentOptions = $derived(
        products
            .filter((p) => p.parent_id === null && p.packaging && p.id !== presentation?.id)
            .map((p) => ({ id: p.id, label: p.name }))
    )

    const selectedParent = $derived(products.find((p) => p.id === form.parent_id) ?? null)
    const parentPackagingValue = $derived(
        selectedParent?.packaging && selectedParent.packaging.value > 0
            ? selectedParent.packaging.value
            : 1
    )
    const selectedPackaging = $derived(
        packagings.find((p) => p.id === form.packaging_id) ?? null
    )

    // effectiveValue = unidades base que representa 1 unidad de esta presentación.
    const effectiveValue = $derived.by((): number => {
        if (form.pricing_mode === 'packaging') {
            return selectedPackaging && selectedPackaging.value > 0 ? selectedPackaging.value : 0
        }
        if (form.pricing_mode === 'quantity') {
            return round2(form.packaging_value)
        }
        // from_price: cantidad = precioMaxPres × valuePadre / precioMaxPadre.
        return computeFromPriceValue(
            maxPrice(form.prices),
            parentPackagingValue,
            maxPrice(selectedParent?.prices ?? [])
        )
    })

    // Costo calculado del padre: (costo/unidad-base del padre) × effectiveValue.
    const calculatedCost = $derived.by((): number => {
        if (!selectedParent) return 0
        return computeCalculatedCost(selectedParent.cost, parentPackagingValue, effectiveValue)
    })

    const virtualStock = $derived(
        selectedParent ? computePresentationStock(selectedParent.stock, effectiveValue) : 0
    )
    const merma = $derived(
        selectedParent ? computePresentationRemainder(selectedParent.stock, effectiveValue) : 0
    )

    const validation = $derived(presentationSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    // Selección de padre: autocompleta el nombre (solo en create o si el nombre
    // sigue vacío/igual al padre previo), como placepos.
    const setParent = (id: number | null) => {
        const prev = selectedParent
        form.parent_id = id ?? 0
        const next = products.find((p) => p.id === id) ?? null
        if (next && (!form.name.trim() || form.name === prev?.name)) {
            form.name = next.name
        }
    }

    const setMode = (mode: PricingMode) => {
        form.pricing_mode = mode
    }

    const addPrice = () => {
        if (form.prices.length < MAX_PRICES)
            form.prices.push({ sale_price: 0, profit: 0, margin: 0 })
    }
    const removePrice = (index: number) => {
        if (form.prices.length > 1) form.prices.splice(index, 1)
    }

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        if (effectiveValue <= 0) {
            submitError = 'Configura la medida de la presentación (empaque o cantidad).'
            return
        }
        const data = validation.data
        const cost = calculatedCost
        const isVariable = data.pricing_mode !== 'packaging'

        const prices: ProductPricePayload[] = data.prices.map((p) => {
            const profit = round2(p.sale_price - cost)
            const margin = p.sale_price > 0 ? round2((profit / p.sale_price) * 100) : 0
            return { ...(p.id ? { id: p.id } : {}), sale_price: p.sale_price, profit, margin }
        })

        const payload: ProductPayload = {
            name: data.name.trim(),
            sku_code: data.sku_code.trim() || undefined,
            bar_code: data.bar_code.trim() || undefined,
            description: data.description.trim() || undefined,
            product_type: presentation?.product_type ?? 'SIMPLE',
            parent_id: data.parent_id,
            category_id: selectedParent?.category_id ?? null,
            packaging_id: isVariable ? null : data.packaging_id,
            packaging_value: isVariable ? effectiveValue : undefined,
            show_in_pos: data.show_in_pos,
            is_purchasable: false,
            // El stock de una presentación se deriva del padre; se persiste 0.
            stock: 0,
            cost,
            prices
        }

        // En creación el id lo devuelve el backend; en edición ya lo teníamos.
        // Sin id no hay contra qué subir la imagen.
        const handleSaved = async (result: { id: number }) => {
            const savedId = presentation?.id ?? result.id
            const imageError = await image.syncImage(savedId)
            // La presentación YA se guardó: cerrar y avisar del problema de la
            // imagen aparte. Dejar el formulario abierto invitaría a guardar
            // otra vez y crear un duplicado.
            if (imageError) {
                toast.warning(`Presentación guardada, pero la imagen no: ${imageError}`)
            }
            onSuccess()
        }

        const handlers = {
            onSuccess: handleSaved,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo guardar la presentación.')
        }
        if (isEdit && presentation) {
            u.current.mutate({ id: presentation.id, payload }, handlers)
        } else {
            c.current.mutate(payload, handlers)
        }
    }

    return {
        form,
        image,
        isEdit,
        setParent,
        setMode,
        addPrice,
        removePrice,
        get parentOptions() {
            return parentOptions
        },
        get selectedParent() {
            return selectedParent
        },
        get effectiveValue() {
            return effectiveValue
        },
        get calculatedCost() {
            return calculatedCost
        },
        get virtualStock() {
            return virtualStock
        },
        get merma() {
            return merma
        },
        get errors() {
            return errors
        },
        get canAddPrice() {
            return form.prices.length < MAX_PRICES
        },
        get canRemovePrice() {
            return form.prices.length > 1
        },
        submit,
        // `isPending` de la mutación baja a `false` en cuanto la presentación
        // se guarda — ANTES de que termine `image.syncImage` dentro de
        // `handleSaved` (async). Sin `|| image.isUploading` el botón se
        // rehabilita con la imagen todavía subiendo, y un segundo clic en ese
        // instante dispara `create.mutate` otra vez → duplicado.
        get isSubmitting() {
            return c.current.isPending || u.current.isPending || image.isUploading
        },
        get submitError() {
            return submitError
        }
    }
}
