<script lang="ts">
    import { formatCurrency } from '$lib/utils/numbers'

    type Tone = 'asset' | 'liability' | 'neutral'

    interface Props {
        label: string
        value: number
        tone?: Tone
        indent?: boolean
        /** Aclaración bajo la etiqueta. Se usa para lo facturado que no es caja. */
        hint?: string
    }
    let { label, value, tone = 'neutral', indent = false, hint }: Props = $props()

    const TONE_CLASS: Record<Tone, string> = {
        asset: 'text-success',
        liability: 'text-destructive',
        neutral: 'text-foreground'
    }
</script>

<div class="flex items-center justify-between px-3 py-2 {indent ? 'pl-6' : ''}">
    <span class="flex flex-col">
        <span class="text-xs {indent ? 'text-muted-foreground/70' : 'text-muted-foreground'}"
            >{label}</span
        >
        {#if hint}
            <span class="text-[10px] text-muted-foreground/60">{hint}</span>
        {/if}
    </span>
    <span class="text-sm font-semibold {TONE_CLASS[tone]}">{formatCurrency(value)}</span>
</div>
