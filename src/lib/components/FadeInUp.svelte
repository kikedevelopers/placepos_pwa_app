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

<div
    class={cn('motion-safe:animate-fade-in-up', className)}
    style="animation-delay:{delay}ms;animation-duration:{duration}ms;animation-fill-mode:both"
>
    {@render children()}
</div>
