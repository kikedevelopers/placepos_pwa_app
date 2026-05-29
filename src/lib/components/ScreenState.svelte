<script lang="ts">
    import { AlertTriangle, Inbox } from '@lucide/svelte'
    import Spinner from '$lib/components/Spinner.svelte'

    interface Props {
        kind: 'loading' | 'error' | 'empty'
        message?: string
    }
    let { kind, message }: Props = $props()

    const isError = $derived(kind === 'error')
    const color = $derived(isError ? 'hsl(32, 95%, 44%)' : 'hsl(215, 16%, 47%)')
    const bg = $derived(isError ? 'hsla(32, 95%, 44%, 0.10)' : 'hsla(215, 16%, 47%, 0.10)')
    const fallback = $derived(
        isError ? 'No se pudo cargar la información.' : 'Sin datos para mostrar.'
    )
</script>

{#if kind === 'loading'}
    <div class="flex items-center justify-center py-16">
        <Spinner />
    </div>
{:else}
    <div class="flex flex-col items-center justify-center px-8 py-16">
        <div
            class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style="background-color:{bg}"
        >
            {#if isError}
                <AlertTriangle size={26} {color} strokeWidth={1.8} />
            {:else}
                <Inbox size={26} {color} strokeWidth={1.8} />
            {/if}
        </div>
        <p class="text-center text-sm text-muted-foreground">{message ?? fallback}</p>
    </div>
{/if}
