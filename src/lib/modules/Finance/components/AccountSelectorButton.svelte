<script lang="ts">
    import { ChevronsUpDown } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { formatCurrency } from '$lib/utils/numbers'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        name: string
        subtitle?: string
        balance: number
        icon: IconComponent
        onclick: () => void
        /** Sin chevron ni acción cuando solo hay una cuenta. */
        selectable?: boolean
    }
    let { name, subtitle, balance, icon: Icon, onclick, selectable = true }: Props = $props()
</script>

<PressableScale
    {onclick}
    disabled={!selectable}
    class="block w-full"
    ariaLabel="Cambiar cuenta"
>
    <span
        class="flex h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4"
    >
        <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style="background-color:hsla(217,91%,50%,0.12)"
        >
            <Icon size={17} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </span>
        <span class="flex min-w-0 flex-1 flex-col text-left">
            <span class="truncate text-sm font-semibold text-foreground">{name}</span>
            {#if subtitle}
                <span class="truncate text-[11px] text-muted-foreground">{subtitle}</span>
            {/if}
        </span>
        <span class="shrink-0 text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(balance)}
        </span>
        {#if selectable}
            <ChevronsUpDown size={16} color="hsl(215, 16%, 55%)" strokeWidth={2} />
        {/if}
    </span>
</PressableScale>
