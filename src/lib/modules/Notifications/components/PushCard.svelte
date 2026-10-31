<script lang="ts">
    import { BellOff, BellRing, LoaderCircle, Share, Smartphone } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import { pushStore } from '$lib/push/pushStore.svelte'
    import { PUSH_COPY } from '$lib/push/availability'

    /**
     * "Avisos en este dispositivo": activa las notificaciones push o explica por
     * qué no se puede (iPhone sin instalar, bloqueadas, navegador viejo). En el
     * centro de notificaciones solo aparece mientras falte activarlas; en
     * Configuración siempre (con la opción de apagarlas).
     */
    interface Props {
        /** Configuración: muestra también el estado activo y el botón de apagar. */
        persistent?: boolean
        class?: string
    }
    let { persistent = false, class: className = '' }: Props = $props()

    $effect(() => {
        void pushStore.refresh()
    })

    const state = $derived(pushStore.availability)
    const copy = $derived(PUSH_COPY[state])
    const visible = $derived(persistent || (state !== 'granted' && state !== 'server-off'))
    const Icon = $derived(
        state === 'needs-install' ? Smartphone : state === 'granted' ? BellRing : state === 'denied' ? BellOff : BellRing
    )
</script>

{#if visible}
    <div
        class={cn(
            'flex gap-3 rounded-[18px] p-3.5',
            state === 'granted' ? 'bg-success/[0.08]' : state === 'denied' ? 'bg-warning/[0.10]' : 'bg-primary/[0.06]',
            className
        )}
    >
        <span
            class={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]',
                state === 'granted'
                    ? 'bg-success/15 text-success'
                    : state === 'denied'
                      ? 'bg-warning/15 text-warning'
                      : 'bg-primary/12 text-primary'
            )}
        >
            <Icon size={19} strokeWidth={2.1} />
        </span>
        <div class="min-w-0 flex-1">
            <p class="text-[14px] font-semibold tracking-[-0.01em] text-foreground">{copy.title}</p>
            <p class="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{copy.message}</p>
            {#if state === 'needs-install'}
                <p class="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary">
                    <Share size={13} strokeWidth={2.2} />
                    Compartir → Agregar a inicio
                </p>
            {/if}
            {#if pushStore.error}
                <p role="alert" class="mt-2 text-[12.5px] text-destructive">{pushStore.error}</p>
            {/if}
            {#if state === 'default'}
                <button
                    type="button"
                    onclick={() => void pushStore.enable()}
                    disabled={pushStore.busy}
                    class="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[0_6px_14px_-6px_hsl(var(--primary)/0.6)] transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
                >
                    {#if pushStore.busy}<LoaderCircle size={15} class="animate-spin" />{/if}
                    Activar avisos
                </button>
            {:else if state === 'granted' && persistent}
                <button
                    type="button"
                    onclick={() => void pushStore.disable().then(() => pushStore.refresh())}
                    disabled={pushStore.busy}
                    class="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-foreground/[0.06] px-4 text-[13px] font-semibold text-foreground transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
                >
                    {#if pushStore.busy}<LoaderCircle size={15} class="animate-spin" />{/if}
                    Desactivar en este dispositivo
                </button>
            {/if}
        </div>
    </div>
{/if}
