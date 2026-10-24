<script lang="ts">
    import type { Snippet } from 'svelte'
    import { cn } from '$lib/utils'

    /**
     * Superficie base del kit: blanca, borde casi invisible y sombra difusa
     * (profundidad por luz, no por línea). Toda tarjeta premium parte de aquí.
     */
    interface Props {
        children: Snippet
        class?: string
        padded?: boolean
    }
    let { children, class: className = '', padded = false }: Props = $props()
</script>

<div class={cn('surface', padded && 'p-5', className)}>
    {@render children()}
</div>
