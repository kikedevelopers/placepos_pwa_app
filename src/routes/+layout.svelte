<script lang="ts">
    import '../app.css'
    import type { Snippet } from 'svelte'
    import { QueryClientProvider } from '@tanstack/svelte-query'
    import { queryClient } from '$lib/api/queryClient'
    import AuthGate from '$lib/components/AuthGate.svelte'

    let { children }: { children: Snippet } = $props()
</script>

<QueryClientProvider client={queryClient}>
    <AuthGate>
        {@render children()}
    </AuthGate>
</QueryClientProvider>
