<script lang="ts">
    import { Check, Copy } from '@lucide/svelte'
    import { cn } from '$lib/utils'

    /** Copia un dato (teléfono, dirección, el pedido) y confirma con un check. */
    interface Props {
        value: string
        label: string
        class?: string
    }
    let { value, label, class: className = '' }: Props = $props()

    let copied = $state(false)
    let timer: ReturnType<typeof setTimeout> | null = null
    $effect(() => () => {
        if (timer) clearTimeout(timer)
    })

    const copy = () => {
        void navigator.clipboard?.writeText(value).then(
            () => {
                copied = true
                if (timer) clearTimeout(timer)
                timer = setTimeout(() => (copied = false), 1600)
            },
            () => (copied = false)
        )
    }
</script>

<button
    type="button"
    onclick={copy}
    aria-label={copied ? 'Copiado' : `Copiar ${label}`}
    class={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.92] active:bg-foreground/[0.08]',
        className
    )}
>
    {#if copied}
        <Check size={16} strokeWidth={2.4} class="text-success" />
    {:else}
        <Copy size={15} strokeWidth={2.1} />
    {/if}
</button>
