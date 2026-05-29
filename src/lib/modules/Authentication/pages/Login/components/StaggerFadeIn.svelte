<script lang="ts">
    import type { Snippet } from 'svelte'
    import FadeInUp from '$lib/components/FadeInUp.svelte'

    interface Props {
        children: Snippet
        index?: number
        class?: string
    }

    let { children, index = 0, class: className = '' }: Props = $props()
</script>

<FadeInUp {index} class={className}>
    {@render children()}
</FadeInUp>
