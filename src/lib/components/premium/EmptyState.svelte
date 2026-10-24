<script lang="ts">
    import type { Snippet } from 'svelte'
    import { AlertTriangle, Inbox } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'

    /** Estado vacío / error: icono suave, título y una frase de qué hacer. */
    interface Props {
        title: string
        message?: string
        kind?: 'empty' | 'error'
        icon?: IconComponent
        action?: Snippet
    }
    let { title, message, kind = 'empty', icon, action }: Props = $props()
    const Icon = $derived(icon ?? (kind === 'error' ? AlertTriangle : Inbox))
</script>

<div class="flex flex-col items-center px-8 py-12 text-center" role={kind === 'error' ? 'alert' : undefined}>
    <span
        class="flex h-14 w-14 items-center justify-center rounded-[18px] {kind === 'error'
            ? 'bg-warning/[0.12] text-warning'
            : 'bg-foreground/[0.05] text-muted-foreground'}"
    >
        <Icon size={24} strokeWidth={1.9} />
    </span>
    <p class="mt-4 text-[15px] font-semibold text-foreground">{title}</p>
    {#if message}
        <p class="mt-1 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">{message}</p>
    {/if}
    {#if action}<div class="mt-5">{@render action()}</div>{/if}
</div>
