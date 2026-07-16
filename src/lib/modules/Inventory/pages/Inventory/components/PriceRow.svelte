<script lang="ts">
    import { Trash2 } from '@lucide/svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import {
        calculateMarginFromPrices,
        calculatePriceFields,
        calculatePriceFromMargin
    } from '$lib/utils/priceMath'
    import type { PriceInputMode } from './PriceInputModeToggle.svelte'

    // Tipo estructural mínimo: así se reutiliza en el form de producto y en el de
    // presentación sin acoplar el schema. `margin` es opcional para no romper a
    // quien aún no lo pase.
    interface Props {
        price: { sale_price: number; margin?: number }
        index: number
        cost: number
        canRemove: boolean
        onRemove: () => void
        error?: string
        /** 'price' (por defecto) escribe el precio; 'margin' escribe el margen. */
        mode?: PriceInputMode
    }
    let { price, index, cost, canRemove, onRemove, error, mode = 'price' }: Props = $props()

    // En modo PRECIO todo se deriva del precio tecleado. En modo MARGEN manda el
    // margen que el usuario escribió: se conserva tal cual (no se recalcula desde
    // un precio ya redondeado), que es lo que hace que volver a teclearlo dé
    // siempre el mismo precio. Ver `utils/priceMath.ts`.
    const fields = $derived(calculatePriceFields(price.sale_price ?? 0, cost))
    const profit = $derived(fields.profit)
    const margin = $derived(mode === 'margin' ? (price.margin ?? 0) : fields.margin)
    const isPrimary = $derived(index === 0)

    /** Sin decimales de relleno: 30% en vez de 30,0000%; 33,3333% completo. */
    const fmtMargin = (m: number): string => `${Number(m.toFixed(4))}%`

    const onMarginInput = (e: Event) => {
        const raw = (e.currentTarget as HTMLInputElement).value.replace(',', '.')
        const m = raw === '' ? 0 : Number(raw)
        if (!Number.isFinite(m)) return
        price.margin = m
        const next = calculatePriceFromMargin(cost, m)
        // `null` = margen no aplicable (costo 0, o fuera de [0,100)). Se guarda el
        // margen tecleado como feedback, pero NO se toca el precio: mejor dejarlo
        // como estaba que fabricar un número sin sentido.
        if (next !== null) price.sale_price = next
    }
</script>

<div
    class="rounded-xl border p-3"
    style="border-color:{isPrimary
        ? 'hsla(217, 91%, 50%, 0.4)'
        : 'hsl(214, 32%, 89%)'};background-color:{isPrimary ? 'hsla(217, 91%, 50%, 0.05)' : '#ffffff'}"
>
    <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-semibold text-foreground">
            {isPrimary ? 'Precio principal' : `Precio ${index + 1}`}
        </span>
        {#if canRemove}
            <button
                type="button"
                onclick={onRemove}
                class="transition-opacity active:opacity-60"
                aria-label="Eliminar precio"
            >
                <Trash2 size={16} color="hsl(0, 84%, 55%)" />
            </button>
        {/if}
    </div>

    {#if mode === 'margin'}
        <div class="relative">
            <input
                type="text"
                inputmode="decimal"
                value={price.margin ?? 0}
                oninput={onMarginInput}
                aria-label="Margen de ganancia"
                class="h-11 w-full rounded-xl border border-border bg-card px-3 pr-8 text-sm text-foreground outline-none focus:border-primary"
            />
            <span
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >%</span
            >
        </div>
    {:else}
        <MoneyInput
            value={price.sale_price}
            onValueChange={(v) => {
                price.sale_price = v ?? 0
                // El margen guardado sigue al precio para que, al cambiar de modo,
                // el campo ya muestre el valor correcto sin recalcular nada.
                price.margin = calculateMarginFromPrices(v ?? 0, cost)
            }}
            prefix="$ "
            {error}
        />
    {/if}

    <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 px-0.5">
        {#if mode === 'margin'}
            <span class="text-[11px] text-muted-foreground">
                Precio
                <span class="font-semibold text-foreground">{formatCurrency(price.sale_price)}</span>
            </span>
        {/if}
        <span class="text-[11px] text-muted-foreground">
            Ganancia
            <span class="font-semibold {profit < 0 ? 'text-destructive' : 'text-success'}"
                >{formatCurrency(profit)}</span
            >
        </span>
        {#if mode !== 'margin'}
            <span class="text-[11px] text-muted-foreground">
                Margen
                <span class="font-semibold {margin < 0 ? 'text-destructive' : 'text-foreground'}"
                    >{fmtMargin(margin)}</span
                >
            </span>
        {/if}
    </div>
    {#if error && mode === 'margin'}
        <p class="mt-1 text-[11px] text-destructive">{error}</p>
    {/if}
</div>
