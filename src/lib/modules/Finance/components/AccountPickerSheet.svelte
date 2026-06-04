<script lang="ts">
    import { Check } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { formatCurrency } from '$lib/utils/numbers'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'

    export type AccountPickerItem = {
        id: number
        name: string
        subtitle?: string
        balance: number
    }

    interface Props {
        open: boolean
        title: string
        items: AccountPickerItem[]
        selectedId: number | null
        icon: IconComponent
        onSelect: (id: number) => void
        onClose: () => void
    }
    let { open, title, items, selectedId, icon: Icon, onSelect, onClose }: Props = $props()

    const choose = (id: number) => {
        onSelect(id)
        onClose()
    }
</script>

<BottomSheet {open} {title} {onClose}>
    <div class="flex flex-col gap-2 pb-1">
        {#each items as item (item.id)}
            {@const active = item.id === selectedId}
            <PressableScale
                onclick={() => choose(item.id)}
                class="block w-full"
                ariaLabel={item.name}
            >
                <span
                    class="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 {active
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card'}"
                >
                    <span
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style="background-color:hsla(217,91%,50%,0.12)"
                    >
                        <Icon size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                    </span>
                    <span class="flex min-w-0 flex-1 flex-col text-left">
                        <span class="truncate text-sm font-semibold text-foreground">{item.name}</span
                        >
                        {#if item.subtitle}
                            <span class="truncate text-[11px] text-muted-foreground"
                                >{item.subtitle}</span
                            >
                        {/if}
                    </span>
                    <span class="shrink-0 text-sm font-bold tabular-nums text-foreground">
                        {formatCurrency(item.balance)}
                    </span>
                    {#if active}
                        <Check size={17} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
                    {/if}
                </span>
            </PressableScale>
        {/each}
    </div>
</BottomSheet>
