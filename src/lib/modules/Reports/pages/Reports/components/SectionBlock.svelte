<script lang="ts" module>
    export type Accent = 'primary' | 'success' | 'warning' | 'info' | 'destructive'
</script>

<script lang="ts">
    import type { Snippet } from 'svelte'
    import type { IconComponent } from '$lib/types/icon'

    const ACCENT: Record<Accent, { fg: string; bg: string }> = {
        primary: { fg: 'hsl(217, 91%, 50%)', bg: 'hsla(217, 91%, 50%, 0.12)' },
        success: { fg: 'hsl(158, 64%, 38%)', bg: 'hsla(158, 64%, 38%, 0.12)' },
        warning: { fg: 'hsl(32, 95%, 44%)', bg: 'hsla(32, 95%, 44%, 0.14)' },
        info: { fg: 'hsl(199, 89%, 45%)', bg: 'hsla(199, 89%, 45%, 0.12)' },
        destructive: { fg: 'hsl(0, 84%, 55%)', bg: 'hsla(0, 84%, 55%, 0.12)' }
    }

    interface Props {
        icon: IconComponent
        title: string
        subtitle?: string
        accent?: Accent
        right?: Snippet
        children: Snippet
    }
    let { icon: Icon, title, subtitle, accent = 'primary', right, children }: Props = $props()
</script>

<div
    class="overflow-hidden rounded-2xl border border-border bg-card"
    style="box-shadow:0 6px 12px hsla(222,47%,11%,0.05)"
>
    <div class="flex items-center gap-2.5 border-b border-border/60 px-4 py-3">
        <div
            class="flex h-8 w-8 items-center justify-center rounded-lg"
            style="background-color:{ACCENT[accent].bg}"
        >
            <Icon size={16} color={ACCENT[accent].fg} strokeWidth={2} />
        </div>
        <div class="flex-1">
            <p class="text-sm font-semibold text-foreground">{title}</p>
            {#if subtitle}
                <p class="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
            {/if}
        </div>
        {#if right}
            {@render right()}
        {/if}
    </div>
    <div class="px-4 py-3">
        {@render children()}
    </div>
</div>
