<script lang="ts">
    import type { Snippet } from 'svelte'
    import { cn } from '$lib/utils'

    /**
     * Lista agrupada estilo iOS: título pequeño FUERA de la tarjeta, filas
     * dentro separadas por líneas finas con sangría (no tocan el borde
     * izquierdo). Para desgloses, ajustes y listados cortos.
     */
    interface Props {
        title?: string
        caption?: string
        trailing?: Snippet
        footer?: string
        children: Snippet
        class?: string
    }
    let { title, caption, trailing, footer, children, class: className = '' }: Props = $props()
</script>

<section class={cn('flex flex-col', className)}>
    {#if title || trailing}
        <header class="mb-2 flex items-end justify-between gap-3 px-1">
            <div class="min-w-0">
                {#if title}
                    <h3 class="text-[13px] font-semibold tracking-[-0.005em] text-foreground">{title}</h3>
                {/if}
                {#if caption}
                    <p class="mt-0.5 text-[12px] leading-snug text-muted-foreground">{caption}</p>
                {/if}
            </div>
            {#if trailing}
                <div class="shrink-0">{@render trailing()}</div>
            {/if}
        </header>
    {/if}
    <div class="surface group-rows overflow-hidden">
        {@render children()}
    </div>
    {#if footer}
        <p class="mt-2 px-1 text-[11.5px] leading-snug text-muted-foreground">{footer}</p>
    {/if}
</section>
