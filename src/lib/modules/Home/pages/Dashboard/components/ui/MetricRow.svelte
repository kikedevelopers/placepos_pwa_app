<script lang="ts">
    import { cn } from '$lib/utils'
    import { formatCurrency } from '$lib/utils/numbers'
    import { TONE_TEXT, type MetricTone } from './tones'

    interface Props {
        label: string
        value: number
        tone?: MetricTone
        hint?: string
        // Resultado del bloque: línea superior y monto en semibold.
        result?: boolean
        // Cifra principal: fondo tenue y tamaño mayor.
        strong?: boolean
    }
    let { label, value, tone = 'neutral', hint, result = false, strong = false }: Props = $props()
</script>

<div
    class={cn(
        'flex items-baseline justify-between gap-3',
        strong
            ? '-mx-3 mt-1 rounded-2xl bg-muted/70 px-3 py-3'
            : result
              ? 'mt-1 border-t border-border/70 pt-2.5'
              : 'py-1.5'
    )}
>
    <dt class="min-w-0">
        <span
            class={cn(
                'text-[13px]',
                result || strong ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}>{label}</span
        >
        {#if hint}
            <span class="mt-0.5 block text-[11.5px] text-muted-foreground">{hint}</span>
        {/if}
    </dt>
    <dd
        class={cn(
            'shrink-0 tabular-nums',
            strong
                ? 'text-[17px] font-semibold tracking-[-0.01em]'
                : result
                  ? 'text-[14.5px] font-semibold'
                  : 'text-[13.5px] font-medium',
            // Un cero no "sube" ni "baja": sin color semántico.
            value === 0 ? 'text-foreground' : TONE_TEXT[tone]
        )}
    >
        {formatCurrency(value)}
    </dd>
</div>
