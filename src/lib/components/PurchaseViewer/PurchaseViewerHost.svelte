<script lang="ts">
    import { purchaseViewer } from './store.svelte'
    import PurchaseViewerContent from './PurchaseViewerContent.svelte'
</script>

{#if purchaseViewer.visible}
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-black/40"
            onclick={() => purchaseViewer.close()}
        ></button>

        <!-- Hoja deslizable: casi toda la altura, fiel al pageSheet de iOS. -->
        <div
            class="relative h-[94dvh] w-full overflow-hidden rounded-t-3xl bg-background motion-safe:animate-slide-up"
        >
            <PurchaseViewerContent
                purchaseId={purchaseViewer.purchaseId}
                onClose={() => purchaseViewer.close()}
            />
        </div>
    </div>
{/if}
