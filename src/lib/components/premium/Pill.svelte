<script lang="ts">
    import { cn } from '$lib/utils'
    import { TONE_SOFT, type Tone } from './tones'

    /** Pastilla de estado compacta (Vencida, Pagado, NC…). */
    interface Props {
        label: string
        tone?: Tone
        class?: string
    }
    let { label, tone = 'muted', class: className = '' }: Props = $props()
</script>

<span
    class={cn(
        'inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full px-2 text-[11px] font-semibold tracking-[0.01em]',
        TONE_SOFT[tone],
        className
    )}
>
    {label}
</span>
