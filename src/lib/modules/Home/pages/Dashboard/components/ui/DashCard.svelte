<script lang="ts">
    import type { Snippet } from 'svelte'
    import { cn } from '$lib/utils'

    interface Props {
        title: string
        description?: string
        actions?: Snippet
        children: Snippet
        class?: string
    }
    let { title, description, actions, children, class: className = '' }: Props = $props()
</script>

<!--
    Superficie única de las tarjetas del inicio. `relative` contiene a los hijos
    absolutos (sr-only, marcas): sin él se anclan al viewport y mueven el layout.
-->
<section
    class={cn(
        'dash-card relative flex min-w-0 flex-col rounded-[22px] border border-border/70 bg-card p-5',
        className
    )}
>
    <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <h2 class="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
                {title}
            </h2>
            {#if description}
                <p class="mt-1 text-[12.5px] leading-snug text-muted-foreground">{description}</p>
            {/if}
        </div>
        {#if actions}
            <div class="shrink-0">{@render actions()}</div>
        {/if}
    </header>
    <div class="mt-4 flex flex-1 flex-col">{@render children()}</div>
</section>
