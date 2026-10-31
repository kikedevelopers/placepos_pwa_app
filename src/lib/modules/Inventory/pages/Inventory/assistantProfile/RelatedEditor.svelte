<script lang="ts">
    import { fromStore } from 'svelte/store'
    import { Plus, Search, X } from '@lucide/svelte'
    import { Segmented } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import type { RelatedKind, RelatedProduct } from '$lib/api/requests/productAssistant'
    import { useProducts } from '../hooks/useProducts'
    import { PROFILE_LIMITS, RELATED_KIND_OPTIONS, relatedCandidates, removeAt, upsertRelated } from './assistantProfileLogic'

    /**
     * Productos relacionados: el tipo de relación (versión superior, complemento,
     * alternativa) y un buscador que agrega con un toque.
     */
    interface Props {
        productId: number
        related: RelatedProduct[]
        onChange: (related: RelatedProduct[]) => void
    }
    let { productId, related, onChange }: Props = $props()

    const products = fromStore(useProducts())
    let kind = $state<RelatedKind>('upgrade')
    let search = $state('')

    const candidates = $derived(relatedCandidates(products.current.data ?? [], search, productId, related))
    const hint = $derived(RELATED_KIND_OPTIONS.find((o) => o.value === kind)?.hint ?? '')
    const labelOf = (value: RelatedKind) => RELATED_KIND_OPTIONS.find((o) => o.value === value)?.label ?? value
    const KIND_TONE: Record<RelatedKind, string> = {
        upgrade: 'bg-primary/10 text-primary',
        complement: 'bg-success/10 text-success',
        alternative: 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
    }

    const add = (candidate: { id: number; name: string }) => {
        onChange(upsertRelated(related, { product_id: candidate.id, kind, name: candidate.name }, productId))
        search = ''
    }
</script>

<div class="flex flex-col gap-3">
    {#if related.length < PROFILE_LIMITS.related}
        <Segmented
            ariaLabel="Tipo de relación"
            options={RELATED_KIND_OPTIONS.map((o) => ({
                value: o.value,
                label: o.value === 'upgrade' ? 'Superior' : o.label
            }))}
            value={kind}
            onChange={(v) => (kind = v)}
        />
        <p class="-mt-1 px-0.5 text-[12.5px] leading-snug text-muted-foreground">{hint}</p>
        <label class="flex h-12 items-center gap-2 rounded-[14px] bg-foreground/[0.055] px-3.5 transition-[background-color,box-shadow] duration-150 focus-within:bg-card focus-within:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]">
            <Search size={16} strokeWidth={2.2} class="shrink-0 text-muted-foreground" />
            <input
                bind:value={search}
                placeholder="Buscar producto para relacionar"
                aria-label="Buscar producto para relacionar"
                autocomplete="off"
                class="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/75"
            />
        </label>
        {#if search.trim()}
            <ul class="surface group-rows overflow-hidden" aria-label="Resultados">
                {#each candidates as candidate (candidate.id)}
                    <li class="row">
                        <button
                            type="button"
                            onclick={() => add(candidate)}
                            class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05]"
                        >
                            <span class="min-w-0 flex-1">
                                <span class="block truncate text-[14.5px] text-foreground">{candidate.name}</span>
                                {#if candidate.isPresentation}<span class="block text-[12px] text-muted-foreground">Presentación</span>{/if}
                            </span>
                            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Plus size={16} strokeWidth={2.4} />
                            </span>
                        </button>
                    </li>
                {:else}
                    <li class="px-4 py-3 text-[13px] text-muted-foreground">Sin resultados</li>
                {/each}
            </ul>
        {/if}
    {/if}

    {#if related.length > 0}
        <ul class="surface group-rows overflow-hidden" aria-label="Productos relacionados">
            {#each related as item, index (item.product_id)}
                <li class="row flex items-center gap-2.5 py-2.5 pl-4 pr-2">
                    <span class="min-w-0 flex-1 truncate text-[14.5px] text-foreground">{item.name}</span>
                    <span class={cn('shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', KIND_TONE[item.kind])}>
                        {labelOf(item.kind)}
                    </span>
                    <button
                        type="button"
                        aria-label={`Quitar ${item.name}`}
                        onclick={() => onChange(removeAt(related, index))}
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[transform,background-color] duration-150 active:scale-90 active:bg-foreground/10"
                    >
                        <X size={16} strokeWidth={2.3} />
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>
