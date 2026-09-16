<script lang="ts">
    import type { Snippet } from 'svelte'
    import { env } from '$lib/constants/env'
    import { resolveImageSrc } from '$lib/utils/productImage'

    /**
     * `<img>` con degradación elegante: si la URL firmada falla (vencida,
     * bucket sin conexión, red) se pinta `fallback` en vez de un ícono de
     * imagen rota. Espejo del `ProductImage` de placepos (Electron).
     */
    interface Props {
        url: string | null | undefined
        alt: string
        class?: string
        /** 'lazy' (default) para grillas; 'eager' para la foto hero de un modal recién abierto. */
        loading?: 'lazy' | 'eager'
        fallback: Snippet
    }
    let { url, alt, class: className = '', loading = 'lazy', fallback }: Props = $props()

    // El backend manda una ruta relativa al proxy de pos_api; se le antepone la
    // base del API para que el <img> del PWA (otro origen) la cargue.
    const src = $derived(resolveImageSrc(url, env.apiBaseUrl))

    let hasFailed = $state(false)

    // Una URL nueva merece un intento nuevo: sin este reset, una imagen que
    // falló una vez quedaría marcada como rota para siempre aunque el
    // producto reciba una imagen distinta.
    $effect(() => {
        void src
        hasFailed = false
    })
</script>

{#if src && !hasFailed}
    <img
        {src}
        {alt}
        {loading}
        class={className}
        onerror={() => (hasFailed = true)}
    />
{:else}
    {@render fallback()}
{/if}
