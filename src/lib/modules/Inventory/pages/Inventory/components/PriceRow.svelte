<script lang="ts">
    import { Trash2 } from '@lucide/svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { ProductFormData } from '../schemas/product.schema'

    interface Props {
        price: ProductFormData['prices'][number]
        index: number
        cost: number
        canRemove: boolean
        onRemove: () => void
        error?: string
    }
    let { price, index, cost, canRemove, onRemove, error }: Props = $props()

    const round2 = (n: number): number => Math.round(n * 100) / 100

    const profit = $derived(round2((price.sale_price ?? 0) - cost))
    const margin = $derived(
        (price.sale_price ?? 0) > 0 ? round2((profit / (price.sale_price ?? 0)) * 100) : 0
    )
    const isPrimary = $derived(index === 0)
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

    <MoneyInput
        value={price.sale_price}
        onValueChange={(v) => (price.sale_price = v ?? 0)}
        prefix="$ "
        {error}
    />

    <div class="mt-2 flex gap-5 px-0.5">
        <span class="text-[11px] text-muted-foreground">
            Ganancia
            <span class="font-semibold {profit < 0 ? 'text-destructive' : 'text-success'}"
                >{formatCurrency(profit)}</span
            >
        </span>
        <span class="text-[11px] text-muted-foreground">
            Margen
            <span class="font-semibold {margin < 0 ? 'text-destructive' : 'text-foreground'}"
                >{formatNumber(margin)}%</span
            >
        </span>
    </div>
</div>
