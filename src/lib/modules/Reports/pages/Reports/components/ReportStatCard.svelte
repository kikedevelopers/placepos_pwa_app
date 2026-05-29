<script lang="ts" module>
    export type StatTint = 'primary' | 'success' | 'info' | 'warning' | 'destructive' | 'violet'
</script>

<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'

    const TINTS: Record<StatTint, { fg: string; bg: string }> = {
        primary: { fg: 'hsl(217, 91%, 50%)', bg: 'hsla(217, 91%, 50%, 0.12)' },
        success: { fg: 'hsl(158, 64%, 38%)', bg: 'hsla(158, 64%, 38%, 0.12)' },
        info: { fg: 'hsl(199, 89%, 45%)', bg: 'hsla(199, 89%, 45%, 0.12)' },
        warning: { fg: 'hsl(32, 95%, 44%)', bg: 'hsla(32, 95%, 44%, 0.14)' },
        destructive: { fg: 'hsl(0, 84%, 55%)', bg: 'hsla(0, 84%, 55%, 0.12)' },
        violet: { fg: 'hsl(258, 80%, 60%)', bg: 'hsla(258, 80%, 60%, 0.12)' }
    }

    interface Props {
        icon: IconComponent
        label: string
        value: string
        description?: string
        tint?: StatTint
    }
    let { icon: Icon, label, value, description, tint = 'primary' }: Props = $props()
    const c = $derived(TINTS[tint])
</script>

<div
    class="flex-1 rounded-2xl border border-border bg-card p-4"
    style="box-shadow:0 6px 12px hsla(222,47%,11%,0.05)"
>
    <div
        class="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
        style="background-color:{c.bg}"
    >
        <Icon size={18} color={c.fg} strokeWidth={2} />
    </div>
    <p class="truncate text-lg font-bold tracking-[-0.3px] text-foreground">{value}</p>
    <p class="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
    {#if description}
        <p class="mt-1 truncate text-[11px] text-muted-foreground/70">{description}</p>
    {/if}
</div>
