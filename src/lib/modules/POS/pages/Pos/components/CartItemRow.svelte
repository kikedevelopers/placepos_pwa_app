<script lang="ts">
    import Trash2 from '@lucide/svelte/icons/trash-2'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { CartItem } from '$lib/modules/POS/store/posCart.svelte'

    let {
        item,
        onEdit,
        onRemove
    }: {
        item: CartItem
        onEdit: () => void
        onRemove: () => void
    } = $props()
</script>

<div class="flex flex-row items-center gap-3 py-3 border-b border-border/50">
    <button
        type="button"
        onclick={onEdit}
        class="flex flex-1 min-w-0 flex-row items-center gap-3 text-left active:opacity-80"
    >
        <div class="flex-1 min-w-0">
            <p class="text-foreground text-sm font-semibold truncate">
                {item.name}
            </p>
            <p class="text-muted-foreground text-[11px] mt-0.5 truncate">
                {formatNumber(item.quantity)} × {formatCurrency(item.price)}{item.note
                    ? ` · ${item.note}`
                    : ''}
            </p>
        </div>
        <span class="text-foreground text-sm font-bold">{formatCurrency(item.total)}</span>
    </button>
    <button
        type="button"
        onclick={(e) => {
            e.stopPropagation()
            onRemove()
        }}
        class="p-1 active:opacity-60"
        aria-label="Eliminar"
    >
        <Trash2 size={16} color="hsl(0, 84%, 55%)" />
    </button>
</div>
