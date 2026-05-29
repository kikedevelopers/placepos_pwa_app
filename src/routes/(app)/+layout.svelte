<script lang="ts">
    import type { Snippet } from 'svelte'
    import AppHeader from '$lib/components/AppHeader.svelte'
    import AppTabBar from '$lib/components/AppTabBar.svelte'

    let { children }: { children: Snippet } = $props()
</script>

<div class="flex min-h-[100dvh] flex-col bg-background">
    <AppHeader />
    <main class="flex flex-1 flex-col">
        {@render children()}
    </main>
    <AppTabBar />
</div>
