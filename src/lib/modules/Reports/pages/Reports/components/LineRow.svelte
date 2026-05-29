<script lang="ts" module>
    export type RowTone =
        | 'asset'
        | 'liability'
        | 'neutral'
        | 'muted'
        | 'info'
        | 'warning'
        | 'primary'
</script>

<script lang="ts">
    const TONE_CLASS: Record<RowTone, string> = {
        asset: 'text-success',
        liability: 'text-destructive',
        neutral: 'text-foreground',
        muted: 'text-muted-foreground',
        info: 'text-info',
        warning: 'text-warning',
        primary: 'text-primary'
    }

    interface Props {
        label: string
        value: string
        tone?: RowTone
        bold?: boolean
        indent?: boolean
        hint?: string
    }
    let { label, value, tone = 'neutral', bold = false, indent = false, hint }: Props = $props()
</script>

<div class="flex items-center justify-between py-2 {indent ? 'pl-4' : ''}">
    <div class="flex-1 pr-3">
        <p class="text-xs {indent ? 'text-muted-foreground/70' : 'text-muted-foreground'}">
            {label}
        </p>
        {#if hint}
            <p class="mt-0.5 text-[10px] text-muted-foreground/60">{hint}</p>
        {/if}
    </div>
    <span class="text-sm {bold ? 'font-bold' : 'font-semibold'} {TONE_CLASS[tone]}">{value}</span>
</div>
