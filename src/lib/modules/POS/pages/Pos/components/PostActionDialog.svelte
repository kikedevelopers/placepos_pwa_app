<script lang="ts">
    import { CheckCircle2 } from '@lucide/svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'

    interface Props {
        visible: boolean
        ticketNumber: string
        onCharge: () => void
        onClose: () => void
    }

    let { visible, ticketNumber, onCharge, onClose }: Props = $props()
</script>

{#if visible}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
        role="presentation"
        onclick={onClose}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="flex w-full max-w-sm flex-col items-center rounded-3xl bg-card p-6"
            onclick={(e) => e.stopPropagation()}
        >
            <div
                class="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style="background-color:hsla(158,64%,38%,0.12)"
            >
                <CheckCircle2 size={30} color="hsl(158, 64%, 38%)" strokeWidth={2} />
            </div>
            <p class="text-lg font-bold text-foreground">Pedido registrado</p>
            <p class="mt-1 text-sm text-muted-foreground">Ticket {ticketNumber}</p>

            <div class="mt-5 w-full">
                <PrimaryButton label="Cobrar pedido" onclick={onCharge} />
            </div>
            <button
                type="button"
                onclick={onClose}
                class="mt-3 py-2 text-sm font-medium text-muted-foreground transition-opacity active:opacity-70"
            >
                Cerrar
            </button>
        </div>
    </div>
{/if}
