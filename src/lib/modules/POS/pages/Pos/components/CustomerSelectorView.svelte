<script lang="ts">
    import ArrowLeft from '@lucide/svelte/icons/arrow-left'
    import Check from '@lucide/svelte/icons/check'
    import User from '@lucide/svelte/icons/user'
    import type { PosCustomer } from '$lib/api/requests/pos'
    import SearchField from '$lib/components/SearchField.svelte'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { usePosCustomers } from '$lib/modules/POS/pages/Pos/hooks/usePosData'

    interface Props {
        selectedId: number | null
        onSelect: (customer: PosCustomer | null) => void
        onBack: () => void
    }
    let { selectedId, onSelect, onBack }: Props = $props()

    const query = usePosCustomers()

    let search = $state('')
    const debounced = useDebouncedValue(() => search, 200)

    const filtered = $derived.by(() => {
        const list = $query.data ?? []
        const q = debounced.value.trim().toLowerCase()
        if (!q) return list
        return list.filter(
            (c) => c.name.toLowerCase().includes(q) || (c.address ?? '').toLowerCase().includes(q)
        )
    })
</script>

<div class="flex flex-1 flex-col">
    <div class="flex flex-row items-center gap-2 border-b border-border/70 bg-card px-3 py-2">
        <button
            type="button"
            onclick={onBack}
            class="flex h-10 w-10 items-center justify-center active:opacity-60"
            aria-label="Volver"
        >
            <ArrowLeft size={22} color="hsl(215, 16%, 40%)" />
        </button>
        <span class="text-base font-bold text-foreground">Seleccionar cliente</span>
    </div>

    <div class="flex flex-col gap-3 px-5 pt-4">
        <SearchField bind:value={search} placeholder="Buscar cliente" />
        <button
            type="button"
            onclick={() => onSelect(null)}
            class="flex flex-row items-center justify-between border-b border-border/50 py-3 active:opacity-70"
        >
            <span class="text-sm text-muted-foreground">Sin cliente (consumidor final)</span>
            {#if selectedId === null}
                <Check size={16} color="hsl(217, 91%, 50%)" />
            {/if}
        </button>
    </div>

    <div class="flex-1 overflow-y-auto px-5 pb-8">
        {#each filtered as item (item.id)}
            <button
                type="button"
                onclick={() => onSelect(item)}
                class="flex w-full flex-row items-center gap-3 border-b border-border/50 py-3 text-left active:opacity-70"
            >
                <div
                    class="flex h-9 w-9 items-center justify-center rounded-full"
                    style="background-color: hsla(217, 91%, 50%, 0.12);"
                >
                    <User size={16} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-foreground">{item.name}</p>
                    {#if item.address}
                        <p class="truncate text-[11px] text-muted-foreground">{item.address}</p>
                    {/if}
                </div>
                {#if selectedId === item.id}
                    <Check size={16} color="hsl(217, 91%, 50%)" />
                {/if}
            </button>
        {/each}
    </div>
</div>
