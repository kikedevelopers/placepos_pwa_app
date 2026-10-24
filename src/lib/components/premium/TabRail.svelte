<script lang="ts">
    import { cn } from '$lib/utils'

    /**
     * Pestañas de sección desplazables (Ventas · Cartera · …). El activo lleva
     * fondo oscuro sólido y se centra solo en pantalla al elegirlo, para que la
     * última pestaña nunca quede escondida tras el borde.
     */
    interface Props {
        tabs: readonly { id: string; label: string }[]
        value: string
        onChange: (id: string) => void
        ariaLabel: string
    }
    let { tabs, value, onChange, ariaLabel }: Props = $props()

    let rail = $state<HTMLDivElement | null>(null)

    $effect(() => {
        void value
        const active = rail?.querySelector<HTMLElement>('[aria-selected="true"]')
        active?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    })
</script>

<div
    bind:this={rail}
    role="tablist"
    aria-label={ariaLabel}
    class="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
>
    {#each tabs as tab (tab.id)}
        {@const active = tab.id === value}
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onclick={() => onChange(tab.id)}
            class={cn(
                'h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[13.5px] transition-[background-color,color,transform] duration-200 ease-out-strong active:scale-[0.95]',
                active
                    ? 'bg-foreground font-semibold text-background shadow-[0_6px_14px_-6px_rgba(15,23,42,0.45)]'
                    : 'bg-foreground/[0.05] font-medium text-muted-foreground'
            )}
        >
            {tab.label}
        </button>
    {/each}
</div>
