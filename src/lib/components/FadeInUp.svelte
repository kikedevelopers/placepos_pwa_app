<script lang="ts">
    import type { Snippet } from 'svelte'
    import { cn } from '$lib/utils'

    interface Props {
        children: Snippet
        index?: number
        delayStep?: number
        duration?: number
        class?: string
    }

    let { children, index = 0, delayStep = 60, duration = 360, class: className = '' }: Props =
        $props()

    const delay = $derived(index * delayStep)
</script>

<!--
    fill-mode `backwards` (NO `both`): aplica el estado inicial durante el delay
    para la entrada escalonada, pero al terminar la animación el elemento vuelve
    a su estilo base (transform: none). Con `both` quedaba `transform:
    translateY(0)` retenido, y un transform ≠ none convierte al div en bloque
    contenedor de sus descendientes `position: fixed` — eso rompía los BottomSheet
    (selector de cuentas en Bancos/Billeteras) anclándolos a esta caja en vez del
    viewport. El estado visual final es idéntico (translateY(0) ≡ none).
-->
<div
    class={cn('motion-safe:animate-fade-in-up', className)}
    style="animation-delay:{delay}ms;animation-duration:{duration}ms;animation-fill-mode:backwards"
>
    {@render children()}
</div>
