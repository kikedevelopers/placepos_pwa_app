<script lang="ts">
    import { RotateCw } from '@lucide/svelte'
    import DashCard from './DashCard.svelte'
    import Skeleton from './Skeleton.svelte'

    interface Props {
        title: string
        status: 'loading' | 'error'
        message?: string
        rows?: number
        onRetry?: () => unknown
    }
    let { title, status, message, rows = 4, onRetry }: Props = $props()

    let retrying = $state(false)
    // Desactiva el botón mientras reintenta: sin esto el clic no da señal.
    const retry = async () => {
        if (!onRetry || retrying) return
        retrying = true
        try {
            await onRetry()
        } finally {
            retrying = false
        }
    }
</script>

<DashCard {title}>
    {#if status === 'loading'}
        <div class="space-y-3" role="status" aria-label={`Cargando ${title.toLowerCase()}`}>
            {#each Array.from({ length: rows }, (_, i) => i) as i (i)}
                <div class="flex items-center justify-between">
                    <Skeleton class="h-3.5 w-28" />
                    <Skeleton class="h-3.5 w-20" />
                </div>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-start gap-3" role="alert">
            <p class="text-[13px] text-muted-foreground">{message}</p>
            {#if onRetry}
                <button
                    type="button"
                    onclick={retry}
                    disabled={retrying}
                    class="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[13px] font-medium text-foreground transition-[transform,opacity] duration-150 ease-out-strong active:scale-[0.97] disabled:opacity-60"
                >
                    <span class={retrying ? 'animate-spin' : ''}><RotateCw size={14} strokeWidth={2} /></span>
                    {retrying ? 'Reintentando…' : 'Reintentar'}
                </button>
            {/if}
        </div>
    {/if}
</DashCard>
