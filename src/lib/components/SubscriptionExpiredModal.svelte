<script lang="ts">
    import { CalendarClock, Loader2, LogOut } from '@lucide/svelte'
    import { subscriptionBlock } from '$lib/stores/subscriptionBlock.svelte'
    import { useLogout } from '$lib/hooks/useLogout'

    /**
     * Modal bloqueante (cloud) que tapa la app cuando la suscripción venció
     * (pos_api responde 402 y el interceptor marca el estado). Único camino:
     * cerrar sesión. No descartable.
     */
    const logout = useLogout()
    let loggingOut = $state(false)

    const onLogout = async () => {
        if (loggingOut) return
        loggingOut = true
        try {
            subscriptionBlock.reset()
            await logout()
        } catch {
            window.location.reload()
        }
    }
</script>

{#if subscriptionBlock.expired}
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <!-- Hero -->
            <div class="border-b border-border/60 bg-gradient-to-br from-destructive/[0.14] via-destructive/[0.05] to-transparent px-6 pb-6 pt-7 text-center">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 text-white shadow-lg shadow-destructive/30">
                    <CalendarClock size={32} strokeWidth={2} />
                </div>
                <h2 class="mt-4 text-lg font-bold text-foreground">Tu suscripción venció</h2>
                <p class="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    El acceso quedó suspendido. Para seguir usando la aplicación, renueva tu
                    suscripción y vuelve a iniciar sesión.
                </p>
            </div>

            <!-- Acción -->
            <div class="px-6 py-5">
                <button
                    type="button"
                    onclick={onLogout}
                    disabled={loggingOut}
                    class="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-destructive-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
                >
                    {#if loggingOut}
                        <Loader2 size={16} class="animate-spin" />
                    {:else}
                        <LogOut size={16} />
                    {/if}
                    Cerrar sesión
                </button>
                <p class="mt-3 text-center text-[11px] text-muted-foreground/80">
                    ¿Dudas con tu renovación? Contacta al administrador.
                </p>
            </div>
        </div>
    </div>
{/if}
