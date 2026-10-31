<script lang="ts">
    import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query'
    import AssistantProfileSheet, { type AssistantProfileTarget } from './AssistantProfileSheet.svelte'

    /** Solo para tests: monta la ficha con su QueryClient. */
    let { client, target, onClose }: { client: QueryClient; target: AssistantProfileTarget; onClose: () => void } =
        $props()
</script>

<QueryClientProvider {client}>
    <AssistantProfileSheet {target} {onClose} />
</QueryClientProvider>
