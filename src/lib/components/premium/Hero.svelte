<script lang="ts">
    import type { Snippet } from 'svelte'
    import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import Money from './Money.svelte'
    import { signedPercent, trendOf } from './format'

    /**
     * La cifra protagonista de una pantalla: etiqueta pequeña, monto grande con
     * números tabulares y, opcional, una variación con flecha y color. Debajo,
     * un snippet libre para el contexto (desglose corto, rango…).
     */
    interface Props {
        label: string
        amount?: number
        /** Texto en vez de monto (p. ej. un conteo). */
        text?: string
        deltaPct?: number | null
        deltaLabel?: string
        caption?: string
        tone?: 'default' | 'negative'
        children?: Snippet
        class?: string
    }
    let {
        label,
        amount,
        text,
        deltaPct,
        deltaLabel,
        caption,
        tone = 'default',
        children,
        class: className = ''
    }: Props = $props()

    const trend = $derived(trendOf(deltaPct ?? null))
</script>

<div class={cn('surface px-5 pb-5 pt-[18px]', className)}>
    <p class="text-[13px] font-medium text-muted-foreground">{label}</p>
    <div
        class={cn(
            'mt-1.5 text-[34px] font-semibold leading-[1.05] tracking-[-0.035em]',
            tone === 'negative' ? 'text-destructive' : 'text-foreground'
        )}
    >
        {#if text !== undefined}
            <span class="tabular-nums">{text}</span>
        {:else}
            <Money value={amount} />
        {/if}
    </div>
    {#if deltaPct !== undefined || caption}
        <div class="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {#if deltaPct !== undefined}
                <span
                    class={cn(
                        'inline-flex h-6 items-center gap-0.5 rounded-full pl-1.5 pr-2 text-[12px] font-semibold tabular-nums',
                        trend === 'up' && 'bg-success/10 text-success',
                        trend === 'down' && 'bg-destructive/10 text-destructive',
                        trend === 'flat' && 'bg-foreground/[0.06] text-muted-foreground'
                    )}
                >
                    {#if trend === 'up'}<ArrowUpRight size={14} strokeWidth={2.4} />
                    {:else if trend === 'down'}<ArrowDownRight size={14} strokeWidth={2.4} />
                    {:else}<Minus size={13} strokeWidth={2.4} />{/if}
                    {signedPercent(deltaPct)}
                </span>
                {#if deltaLabel}
                    <span class="text-[12.5px] text-muted-foreground">{deltaLabel}</span>
                {/if}
            {/if}
            {#if caption}
                <span class="text-[12.5px] text-muted-foreground">{caption}</span>
            {/if}
        </div>
    {/if}
    {#if children}
        <div class="mt-4">{@render children()}</div>
    {/if}
</div>
