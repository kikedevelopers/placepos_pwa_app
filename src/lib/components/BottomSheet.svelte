<script lang="ts">
    import { portal } from '$lib/actions/portal'
    import type { Snippet } from 'svelte'

    /**
     * Bottom-sheet genérico (backdrop + panel deslizante con safe-area), patrón
     * extraído de SettingsSheet para reutilizar en filtros de Informes. El
     * contenido y un footer opcional (acciones) llegan como snippets.
     */
    interface Props {
        open: boolean
        title?: string
        onClose: () => void
        children: Snippet
        footer?: Snippet
    }

    let { open, title, onClose, children, footer }: Props = $props()
</script>

{#if open}
    <div use:portal class="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-[rgba(9,14,28,0.38)] motion-safe:animate-fade-in"
            onclick={onClose}
        ></button>

        <!--
            `w-full` sin tope: el sheet acompaña al ancho disponible. El app-shell
            no tiene `max-w` en ninguna parte (ver `(app)/+layout.svelte`), así que
            un tope aquí dejaba una tarjeta angosta y centrada bajo un contenido que
            sí se estiraba a todo el viewport — dos anchos distintos en la misma
            pantalla.
        -->
        <div
            class="relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-card px-5 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-12px_40px_-12px_rgba(9,14,28,0.25)] motion-safe:animate-slide-up"
        >
            <div class="mx-auto mb-3 h-[5px] w-9 shrink-0 rounded-full bg-foreground/15"></div>
            {#if title}
                <h3 class="mb-4 shrink-0 text-[19px] font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
            {/if}

            <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {@render children()}
            </div>

            {#if footer}
                <div class="mt-5 shrink-0">
                    {@render footer()}
                </div>
            {/if}
        </div>
    </div>
{/if}
