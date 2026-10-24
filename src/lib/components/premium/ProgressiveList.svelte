<script lang="ts" generics="T">
    import type { Snippet } from 'svelte'
    import { nextLimit } from './listing'

    /**
     * Pinta una lista larga POR TANDAS: primero `step` elementos y, cuando el
     * centinela del final entra en pantalla, la siguiente tanda. Un informe de
     * un año con miles de tickets no congela el móvil. `resetKey` vuelve a la
     * primera tanda (nuevo filtro/búsqueda).
     */
    interface Props {
        items: readonly T[]
        step?: number
        resetKey?: unknown
        children: Snippet<[T[]]>
    }
    let { items, step = 40, resetKey = undefined, children }: Props = $props()

    let limit = $state(0)
    $effect(() => {
        void resetKey
        limit = step
    })

    const shown = $derived(items.slice(0, Math.max(limit, step)))
    const hasMore = $derived(shown.length < items.length)

    const sentinel = (node: HTMLElement) => {
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    limit = nextLimit(Math.max(limit, step), step, items.length)
                }
            },
            { rootMargin: '600px 0px' }
        )
        io.observe(node)
        return { destroy: () => io.disconnect() }
    }
</script>

{@render children(shown)}

{#if hasMore}
    <div use:sentinel class="flex justify-center py-6 text-[12px] text-muted-foreground" aria-hidden="true">
        Cargando más…
    </div>
{/if}
