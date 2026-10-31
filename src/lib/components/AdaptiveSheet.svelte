<script lang="ts">
    import type { Snippet } from 'svelte'
    import { fade, fly } from 'svelte/transition'
    import { portal } from '$lib/actions/portal'
    import { useResponsive } from '$lib/hooks/useResponsive.svelte'
    import { easeDrawer } from '$lib/utils/easing'

    /**
     * Panel que se adapta al dispositivo: en el teléfono es un sheet que sube
     * desde abajo (alto casi completo, con asa); en la tablet es un cajón a la
     * derecha a toda la altura. Entra con la curva de cajón de iOS y sale más
     * rápido (asimétrico: el sistema responde, no hace esperar).
     */
    interface Props {
        open: boolean
        onClose: () => void
        ariaLabel: string
        /** Ancho del cajón en tablet. */
        width?: number
        children: Snippet
    }
    let { open, onClose, ariaLabel, width = 440, children }: Props = $props()

    const responsive = useResponsive()
    const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

    const enter = $derived(
        responsive.isTablet
            ? { x: width, duration: reduceMotion ? 0 : 340, easing: easeDrawer, opacity: 1 }
            : { y: 640, duration: reduceMotion ? 0 : 380, easing: easeDrawer, opacity: 1 }
    )
    const leave = $derived(
        responsive.isTablet
            ? { x: width, duration: reduceMotion ? 0 : 220, easing: easeDrawer, opacity: 1 }
            : { y: 640, duration: reduceMotion ? 0 : 240, easing: easeDrawer, opacity: 1 }
    )

    const onKeydown = (event: KeyboardEvent) => {
        if (open && event.key === 'Escape') onClose()
    }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
    <div use:portal class="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-[rgba(9,14,28,0.38)] backdrop-blur-[1.5px]"
            transition:fade={{ duration: reduceMotion ? 0 : 200 }}
            onclick={onClose}
        ></button>

        {#if responsive.isTablet}
            <div
                class="absolute inset-y-0 right-0 flex max-w-[calc(100vw-24px)] flex-col bg-card pt-[var(--app-safe-top)] shadow-[-24px_0_48px_-24px_rgba(9,14,28,0.32)]"
                style="width:{width}px"
                in:fly={enter}
                out:fly={leave}
            >
                {@render children()}
            </div>
        {:else}
            <div
                class="absolute inset-x-0 bottom-0 flex h-[92dvh] flex-col rounded-t-[28px] bg-card shadow-[0_-12px_40px_-12px_rgba(9,14,28,0.25)]"
                in:fly={enter}
                out:fly={leave}
            >
                <div aria-hidden="true" class="mx-auto mt-2.5 h-[5px] w-9 shrink-0 rounded-full bg-foreground/15"></div>
                {@render children()}
            </div>
        {/if}
    </div>
{/if}
