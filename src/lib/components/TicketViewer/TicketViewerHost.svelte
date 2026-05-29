<script lang="ts">
    import { ticketViewer } from './store.svelte'
    import TicketViewerContent from './TicketViewerContent.svelte'
</script>

{#if ticketViewer.visible}
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-black/40"
            onclick={() => ticketViewer.close()}
        ></button>

        <!-- Hoja deslizable: casi toda la altura, fiel al pageSheet de iOS. -->
        <div
            class="relative mx-auto h-[94dvh] w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-background motion-safe:animate-slide-up"
        >
            <TicketViewerContent
                ticketId={ticketViewer.ticketId}
                onClose={() => ticketViewer.close()}
            />
        </div>
    </div>
{/if}
