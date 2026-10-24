<script lang="ts">
    import { ChevronDown } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { cn } from '$lib/utils'

    /**
     * Botón de la barra de filtros: abre un sheet. Chevron de afordancia, y un
     * contador cuando hay filtros activos. Mismo alto (36px) que la búsqueda
     * compacta para que la barra se lea como un solo set.
     */
    interface Props {
        icon?: IconComponent
        label: string
        onclick: () => void
        count?: number
        active?: boolean
        ariaLabel?: string
    }
    let { icon: Icon, label, onclick, count, active = false, ariaLabel }: Props = $props()
</script>

<button
    type="button"
    {onclick}
    aria-label={ariaLabel}
    class={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-3 pr-2.5 text-[13px] font-semibold transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]',
        active ? 'bg-primary/10 text-primary' : 'bg-card text-foreground shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]'
    )}
>
    {#if Icon}<Icon size={15} strokeWidth={2.2} />{/if}
    <span class="whitespace-nowrap">{label}</span>
    {#if count}
        <span class="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-white">
            {count}
        </span>
    {/if}
    <ChevronDown size={14} strokeWidth={2.2} class="opacity-50" />
</button>
