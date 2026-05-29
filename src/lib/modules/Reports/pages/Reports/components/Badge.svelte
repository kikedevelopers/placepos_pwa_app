<script lang="ts" module>
    export type BadgeTone = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'muted'
</script>

<script lang="ts">
    const TONES: Record<BadgeTone, { text: string; bg: string }> = {
        primary: { text: 'text-primary', bg: 'hsla(217, 91%, 50%, 0.12)' },
        success: { text: 'text-success', bg: 'hsla(158, 64%, 38%, 0.12)' },
        warning: { text: 'text-warning', bg: 'hsla(32, 95%, 44%, 0.14)' },
        destructive: { text: 'text-destructive', bg: 'hsla(0, 84%, 55%, 0.12)' },
        info: { text: 'text-info', bg: 'hsla(199, 89%, 45%, 0.12)' },
        muted: { text: 'text-muted-foreground', bg: 'hsla(215, 16%, 47%, 0.12)' }
    }

    interface Props {
        label: string
        tone?: BadgeTone
    }
    let { label, tone = 'muted' }: Props = $props()
</script>

<span
    class="rounded-full px-2 py-0.5 text-[10px] font-semibold {TONES[tone].text}"
    style="background-color: {TONES[tone].bg}"
>
    {label}
</span>
