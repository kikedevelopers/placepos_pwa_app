<script lang="ts">
    import { AlertCircle, CheckCircle2 } from '@lucide/svelte'

    interface Props {
        kind: 'success' | 'error'
        message: string
    }
    let { kind, message }: Props = $props()

    const isError = $derived(kind === 'error')
    const color = $derived(isError ? 'hsl(0, 84%, 55%)' : 'hsl(158, 64%, 40%)')
    const bg = $derived(isError ? 'hsla(0,84%,55%,0.10)' : 'hsla(158,64%,38%,0.10)')
    const border = $derived(isError ? 'hsla(0,84%,55%,0.30)' : 'hsla(158,64%,38%,0.30)')
    const text = $derived(isError ? 'text-destructive' : 'text-success')
</script>

<div
    class="flex items-start gap-2 rounded-xl px-3 py-2.5"
    style="background-color:{bg};border:1px solid {border}"
>
    {#if isError}
        <AlertCircle size={15} {color} />
    {:else}
        <CheckCircle2 size={15} {color} />
    {/if}
    <span class="flex-1 text-xs leading-4 {text}">{message}</span>
</div>
