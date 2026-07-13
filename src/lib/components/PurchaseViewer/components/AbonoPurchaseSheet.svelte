<script lang="ts">
    import { untrack } from 'svelte'
    import { fromStore } from 'svelte/store'
    import { createMutation, useQueryClient } from '@tanstack/svelte-query'
    import { AlertCircle, HandCoins } from '@lucide/svelte'
    import {
        addPurchasePayment,
        type AddPurchasePaymentPayload
    } from '$lib/api/requests/purchases'
    import { PURCHASE_KEYS } from '$lib/modules/Purchases/constants/queryKeys'
    import { EXPENSE_KEYS } from '$lib/modules/Expenses/constants/queryKeys'
    import { useExpensePaymentMethods } from '$lib/modules/Expenses/pages/Expenses/hooks/useExpensePaymentMethods'
    import PaymentMethodSelect from '$lib/modules/Expenses/pages/Expenses/components/variable/PaymentMethodSelect.svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { abonoExceedsBalance, canSubmitAbono, splitSourceKey } from '../utils/purchaseActions'

    interface Props {
        open: boolean
        purchaseId: number
        balance: number
        onClose: () => void
    }
    let { open, purchaseId, balance, onClose }: Props = $props()

    const queryClient = useQueryClient()
    const methodsQuery = fromStore(useExpensePaymentMethods())
    const methods = $derived(methodsQuery.current.data)
    const mutation = fromStore(
        createMutation({
            mutationFn: (payload: AddPurchasePaymentPayload) =>
                addPurchasePayment(purchaseId, payload)
        })
    )

    let sourceKey = $state('')
    let amount = $state<number | null>(untrack(() => balance))
    let submitError = $state('')

    // Cada apertura repone el monto al saldo pendiente y limpia el estado.
    $effect(() => {
        if (open) {
            amount = untrack(() => balance)
            submitError = ''
        }
    })

    const amt = $derived(amount ?? 0)
    const exceeds = $derived(abonoExceedsBalance(amt, balance))
    const canConfirm = $derived(
        canSubmitAbono({
            amount: amt,
            balance,
            sourceKey,
            pending: mutation.current.isPending
        })
    )

    const submit = () => {
        submitError = ''
        if (!canConfirm) return
        const { source_type, source_id } = splitSourceKey(sourceKey)
        const payload: AddPurchasePaymentPayload = { source_type, source_id, amount: amt }
        mutation.current.mutate(payload, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: PURCHASE_KEYS.detail(purchaseId) })
                queryClient.invalidateQueries({ queryKey: ['purchases', 'list'] })
                // Las fuentes cambiaron de saldo: refresca sus consultas.
                queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.paymentMethods })
                queryClient.invalidateQueries({ queryKey: ['banks'] })
                queryClient.invalidateQueries({ queryKey: ['wallets'] })
                onClose()
            },
            onError: (e) => (submitError = getErrorMessage(e) ?? 'No se pudo registrar el abono.')
        })
    }
</script>

<BottomSheet {open} title="Abonar a la compra" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <!-- Saldo pendiente -->
        <div
            class="flex items-center justify-between rounded-2xl px-4 py-3"
            style="background-color:hsla(32,95%,44%,0.08);border:1px solid hsla(32,95%,44%,0.25)"
        >
            <span class="flex items-center gap-2 text-sm text-muted-foreground">
                <HandCoins size={16} color="hsl(32, 95%, 44%)" strokeWidth={2} />
                Saldo pendiente
            </span>
            <span class="text-base font-bold tabular-nums text-warning"
                >{formatCurrency(balance)}</span
            >
        </div>

        <PaymentMethodSelect
            {methods}
            value={sourceKey}
            onSelect={(key) => {
                sourceKey = key
                submitError = ''
            }}
        />

        <MoneyInput
            label="Monto del abono"
            prefix="$ "
            value={amount}
            onValueChange={(v) => {
                amount = v
                submitError = ''
            }}
            error={exceeds ? 'No puede superar el saldo pendiente' : undefined}
        />

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
            label={`Registrar abono · ${formatCurrency(amt)}`}
            icon={HandCoins}
            loading={mutation.current.isPending}
            disabled={!canConfirm}
            onclick={submit}
        />
    {/snippet}
</BottomSheet>
