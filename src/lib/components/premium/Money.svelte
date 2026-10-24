<script lang="ts">
    import { cn } from '$lib/utils'
    import { splitMoney } from './format'

    /**
     * Monto con jerarquía tipográfica de fintech: el símbolo y los decimales van
     * más pequeños y atenuados, el entero manda. Cifras tabulares para que los
     * montos alineen en columna y no "bailen" al actualizarse.
     */
    interface Props {
        value: number | null | undefined
        decimals?: number
        class?: string
        /** Muestra "+" en los positivos (variaciones, entradas). */
        signed?: boolean
    }
    let { value, decimals = 2, class: className = '', signed = false }: Props = $props()

    const parts = $derived(splitMoney(value, decimals))
    const sign = $derived(parts.negative ? '−' : signed && (value ?? 0) > 0 ? '+' : '')
</script>

<span class={cn('inline-flex items-baseline whitespace-nowrap tabular-nums', className)}>
    {#if sign}<span>{sign}</span>{/if}
    <span class="mr-[0.12em] text-[0.62em] font-medium opacity-55">{parts.symbol}</span>
    <span>{parts.integer}</span>
    {#if parts.fraction}<span class="text-[0.62em] font-medium opacity-55">{parts.fraction}</span>{/if}
</span>
