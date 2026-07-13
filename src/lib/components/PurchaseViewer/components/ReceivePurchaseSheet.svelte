<script lang="ts">
    import { untrack } from 'svelte'
    import { fromStore } from 'svelte/store'
    import { createMutation, useQueryClient } from '@tanstack/svelte-query'
    import { AlertCircle, PackageCheck } from '@lucide/svelte'
    import {
        receivePurchase,
        type ReceivePurchasePayload
    } from '$lib/api/requests/purchases'
    import { PURCHASE_KEYS } from '$lib/modules/Purchases/constants/queryKeys'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { todayISO } from '$lib/utils/dates'
    import { canSubmitReceive, receivedAtISO } from '../utils/purchaseActions'

    interface Props {
        open: boolean
        purchaseId: number
        defaultReceiver?: string | null
        onClose: () => void
    }
    let { open, purchaseId, defaultReceiver, onClose }: Props = $props()

    const queryClient = useQueryClient()
    const mutation = fromStore(
        createMutation({
            mutationFn: (payload: ReceivePurchasePayload) => receivePurchase(purchaseId, payload)
        })
    )

    const today = todayISO()
    let receivedBy = $state(untrack(() => defaultReceiver ?? ''))
    let receivedAt = $state(today)
    let submitError = $state('')
    // Llave de idempotencia por intento de recepción (regenerada al abrir).
    let operationId = $state(crypto.randomUUID())

    $effect(() => {
        if (open) {
            receivedBy = untrack(() => defaultReceiver ?? '')
            receivedAt = today
            submitError = ''
            operationId = crypto.randomUUID()
        }
    })

    const canConfirm = $derived(
        !mutation.current.isPending && canSubmitReceive(receivedBy, receivedAt)
    )

    const submit = () => {
        submitError = ''
        if (!canConfirm) return
        const payload: ReceivePurchasePayload = {
            received_by: receivedBy.trim(),
            received_at: receivedAtISO(receivedAt),
            client_operation_id: operationId
        }
        mutation.current.mutate(payload, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: PURCHASE_KEYS.detail(purchaseId) })
                queryClient.invalidateQueries({ queryKey: ['purchases', 'list'] })
                // La recepción carga mercancía al inventario.
                queryClient.invalidateQueries({ queryKey: ['products'] })
                queryClient.invalidateQueries({ queryKey: ['inventory'] })
                onClose()
            },
            onError: (e) =>
                (submitError = getErrorMessage(e) ?? 'No se pudo marcar la compra como recibida.')
        })
    }
</script>

<BottomSheet {open} title="Marcar como recibida" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <p class="text-xs leading-relaxed text-muted-foreground">
            Al recibir la compra, la mercancía se carga al inventario. Registra quién y cuándo la
            recibió.
        </p>

        <FormField
            bind:value={receivedBy}
            label="Persona que recibe"
            placeholder="Nombre completo del receptor"
            error={submitError && !receivedBy.trim() ? 'Requerido' : undefined}
        />

        <div>
            <span class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70">
                Fecha de recepción
            </span>
            <input
                type="date"
                bind:value={receivedAt}
                max={today}
                class="w-full rounded-[14px] px-3.5 py-3 text-sm text-foreground outline-none"
                style="border:1.5px solid hsla(214, 32%, 89%, 0.9);background-color:hsla(0,0%,100%,0.7)"
            />
        </div>

        {#if submitError}
            <div
                class="flex items-start gap-2 rounded-xl px-3 py-2.5"
                style="background-color:hsla(0,84%,55%,0.10);border:1px solid hsla(0,84%,55%,0.30)"
            >
                <AlertCircle size={15} color="hsl(0, 84%, 55%)" />
                <span class="flex-1 text-xs leading-4 text-destructive">{submitError}</span>
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <PrimaryButton
            label="Confirmar recepción"
            icon={PackageCheck}
            loading={mutation.current.isPending}
            disabled={!canConfirm}
            onclick={submit}
        />
    {/snippet}
</BottomSheet>
