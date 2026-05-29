<script lang="ts">
    import { X, ReceiptText } from '@lucide/svelte'
    import { ticketViewer } from './store.svelte'
</script>

{#if ticketViewer.visible}
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-black/40"
            onclick={() => ticketViewer.close()}
        ></button>

        <div
            class="relative mx-auto max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)] motion-safe:animate-slide-up"
        >
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border"></div>
            <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-foreground">Detalle del ticket</h3>
                <button
                    type="button"
                    aria-label="Cerrar"
                    onclick={() => ticketViewer.close()}
                    class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary transition-transform active:scale-[0.97]"
                >
                    <X size={18} color="hsl(215, 16%, 47%)" />
                </button>
            </div>

            <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div
                    class="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style="background-color: hsla(217, 91%, 50%, 0.12)"
                >
                    <ReceiptText size={30} color="hsl(217, 91%, 50%)" strokeWidth={1.8} />
                </div>
                <p class="text-sm font-semibold text-foreground">Ticket #{ticketViewer.ticketId}</p>
                <p class="max-w-xs text-xs text-muted-foreground">
                    El visor completo del ticket (recibo, resumen financiero y compartir) se está
                    migrando desde pos_app.
                </p>
            </div>
        </div>
    </div>
{/if}
