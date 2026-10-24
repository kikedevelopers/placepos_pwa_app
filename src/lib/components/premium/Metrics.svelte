<script lang="ts">
    import { cn } from '$lib/utils'
    import Money from './Money.svelte'
    import Skeleton from './Skeleton.svelte'
    import { TONE_TEXT } from './tones'
    import type { MetricItem } from './types'

    /**
     * Rejilla compacta de métricas en UNA superficie (2 columnas, líneas finas
     * entre celdas). Las cifras informan sin robarle protagonismo al listado.
     */
    interface Props {
        items: MetricItem[]
        loading?: boolean
        ariaLabel: string
        columns?: 2 | 3
        class?: string
    }
    let { items, loading = false, ariaLabel, columns = 2, class: className = '' }: Props = $props()
</script>

<dl aria-label={ariaLabel} class={cn('surface grid overflow-hidden', columns === 3 ? 'grid-cols-3' : 'grid-cols-2', className)}>
    {#each items as item, i (item.label)}
        <!-- Líneas finas SOLO entre celdas (nunca contra el borde de la tarjeta). -->
        <div class={cn('min-w-0 py-3.5', columns === 3 ? 'px-3.5' : 'px-4', i % columns > 0 && 'border-l border-border/60', i >= columns && 'border-t border-border/60')}>
            <dt class="truncate text-[12px] text-muted-foreground">{item.label}</dt>
            <dd class="mt-1">
                {#if loading}
                    <Skeleton class="h-5 w-20" />
                {:else}
                    <span
                        class={cn(
                            'block truncate text-[17px] font-semibold leading-tight tracking-[-0.02em]',
                            TONE_TEXT[item.tone ?? 'neutral']
                        )}
                    >
                        {#if item.text !== undefined}
                            <span class="tabular-nums">{item.text}</span>
                        {:else}
                            <Money value={item.amount} />
                        {/if}
                    </span>
                    {#if item.hint}
                        <span class="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{item.hint}</span>
                    {/if}
                {/if}
            </dd>
        </div>
    {/each}
</dl>
