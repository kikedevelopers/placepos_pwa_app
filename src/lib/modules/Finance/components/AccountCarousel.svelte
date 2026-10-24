<script lang="ts" module>
    export interface CarouselAccount {
        id: number
        name: string
        subtitle: string
        balance: number
        badge?: string | null
    }
</script>

<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'
    import { snapIndex } from '../utils/accountScreen'
    import AccountCard, { type AccountKind } from './AccountCard.svelte'

    /**
     * Carrusel de tarjetas de cuenta: se desliza con el dedo y encaja (scroll
     * snap nativo, con su inercia). La siguiente tarjeta asoma por el borde para
     * invitar a deslizar; los puntos indican cuál está activa. Con una sola
     * cuenta, la tarjeta ocupa todo el ancho y no hay puntos.
     */
    interface Props {
        kind: AccountKind
        icon: IconComponent
        accounts: CarouselAccount[]
        selectedId: number
        onSelect: (id: number) => void
    }
    let { kind, icon, accounts, selectedId, onSelect }: Props = $props()

    let track = $state<HTMLDivElement | null>(null)
    let raf = 0

    const onScroll = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
            raf = 0
            const el = track
            const first = el?.firstElementChild as HTMLElement | null
            if (!el || !first) return
            const step = first.offsetWidth + 12
            const i = snapIndex(el.scrollLeft, step, accounts.length)
            const id = accounts[i]?.id
            if (id != null && id !== selectedId) {
                navigator.vibrate?.(6)
                onSelect(id)
            }
        })
    }

    const goTo = (index: number) => {
        const el = track
        const first = el?.firstElementChild as HTMLElement | null
        if (!el || !first) return
        el.scrollTo({ left: index * (first.offsetWidth + 12), behavior: 'smooth' })
    }

    const activeIndex = $derived(Math.max(0, accounts.findIndex((a) => a.id === selectedId)))
</script>

{#if accounts.length === 1}
    <AccountCard {kind} {icon} {...accounts[0]} />
{:else}
    <div class="flex flex-col gap-3">
        <div
            bind:this={track}
            onscroll={onScroll}
            class="-mx-5 -my-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Cuentas"
        >
            {#each accounts as account (account.id)}
                <div class="w-[calc(100%-28px)] shrink-0 snap-start">
                    <AccountCard {kind} {icon} {...account} />
                </div>
            {/each}
        </div>
        <div class="flex justify-center gap-1.5" role="tablist" aria-label="Seleccionar cuenta">
            {#each accounts as account, i (account.id)}
                <button
                    type="button"
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={account.name}
                    onclick={() => goTo(i)}
                    class="h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out-strong {i === activeIndex
                        ? 'w-5 bg-foreground/70'
                        : 'w-1.5 bg-foreground/20'}"
                ></button>
            {/each}
        </div>
    </div>
{/if}
