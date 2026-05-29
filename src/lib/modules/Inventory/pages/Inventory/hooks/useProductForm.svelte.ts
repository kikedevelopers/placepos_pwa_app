import { fromStore } from 'svelte/store'
import type { ZodError } from 'zod'
import type { Product, ProductPayload, ProductPricePayload } from '$lib/api/requests/products'
import { getErrorMessage } from '$lib/utils/errors'
import { parseDecimal } from '$lib/utils/numbers'
import { productSchema, type ProductFormData } from '../schemas/product.schema'
import { useProductMutations } from './useProductMutations'

const MAX_PRICES = 4
const round2 = (n: number): number => Math.round(n * 100) / 100

const toDefaults = (product: Product | null): ProductFormData => ({
    name: product?.name ?? '',
    sku_code: product?.sku_code ?? '',
    bar_code: product?.bar_code ?? '',
    description: product?.description ?? '',
    category_id: product?.category_id ?? null,
    packaging_id: product?.packaging_id ?? null,
    show_in_pos: product?.show_in_pos ?? true,
    is_purchasable: product?.is_purchasable ?? false,
    stock: String(product?.stock ?? 0),
    cost: product?.cost ?? 0,
    prices: product?.prices?.length
        ? product.prices.map((p) => ({
              id: p.id,
              sale_price: p.sale_price,
              profit: p.profit,
              margin: p.margin
          }))
        : [{ sale_price: 0, profit: 0, margin: 0 }]
})

/** Aplana los issues de zod a un mapa por ruta ("prices.0.sale_price", "prices"). */
const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/**
 * Controlador del formulario de producto con runes (equivalente al hook
 * react-hook-form + useFieldArray + zodResolver de pos_app). Valida en vivo tras
 * el primer intento de envío.
 */
export function useProductForm(product: Product | null, onSuccess: () => void) {
    const { create, update } = useProductMutations()
    const c = fromStore(create)
    const u = fromStore(update)

    const form = $state<ProductFormData>(toDefaults(product))
    let attempted = $state(false)
    let submitError = $state('')
    const isEdit = !!product

    const validation = $derived(productSchema.safeParse($state.snapshot(form)))
    const errors = $derived(
        attempted && !validation.success ? buildErrors(validation.error) : {}
    )

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
        const data = validation.data

        const cost = data.cost
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
            product_type: product?.product_type ?? 'SIMPLE',
            category_id: data.category_id,
            packaging_id: data.packaging_id,
            show_in_pos: data.show_in_pos,
            is_purchasable: data.is_purchasable,
            stock: parseDecimal(data.stock),
            cost,
            prices
        }

        const handlers = {
            onSuccess,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo guardar el producto.')
        }

        if (isEdit && product) {
            u.current.mutate({ id: product.id, payload }, handlers)
        } else {
            c.current.mutate(payload, handlers)
        }
    }

    return {
        form,
        get errors() {
            return errors
        },
        addPrice,
        removePrice,
        get canAddPrice() {
            return form.prices.length < MAX_PRICES
        },
        get canRemovePrice() {
            return form.prices.length > 1
        },
        submit,
        isEdit,
        get isSubmitting() {
            return c.current.isPending || u.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}
