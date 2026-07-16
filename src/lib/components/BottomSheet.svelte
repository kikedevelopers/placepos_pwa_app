<script lang="ts">
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
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-black/40"
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
            class="relative flex max-h-[85dvh] w-full flex-col rounded-t-3xl bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] motion-safe:animate-slide-up"
        >
            <div class="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border"></div>
            {#if title}
                <h3 class="mb-3 shrink-0 text-base font-bold text-foreground">{title}</h3>
            {/if}

            <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {@render children()}
            </div>

            {#if footer}
                <div class="mt-4 shrink-0">
                    {@render footer()}
                </div>
            {/if}
        </div>
    </div>
{/if}
