<script lang="ts">
    import { untrack } from 'svelte'
    import { fromStore } from 'svelte/store'
    import { createMutation, useQueryClient } from '@tanstack/svelte-query'
    import { AlertCircle, ArrowLeftRight, Banknote, HandCoins } from '@lucide/svelte'
    import {
        processCreditPayment,
        type ProcessCreditPaymentPayload
    } from '$lib/api/requests/credits'
    import { usePosBanks } from '$lib/modules/POS/pages/Pos/hooks/usePosData'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import SelectField, { type SelectOption } from '$lib/components/SelectField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { formatCurrency, roundTo } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'

    interface Props {
        open: boolean
        invoiceId: number
        balance: number
        onClose: () => void
    }
    let { open, invoiceId, balance, onClose }: Props = $props()

    const queryClient = useQueryClient()
    const banksQuery = fromStore(usePosBanks())
    const banks = $derived(banksQuery.current.data ?? [])
    const mutation = fromStore(createMutation({ mutationFn: processCreditPayment }))

    let method = $state<'CASH' | 'TRANSFER'>('CASH')
    let amount = $state<number | null>(untrack(() => balance))
    let bankId = $state('')
    let submitError = $state('')

    // Cada vez que se abre la hoja, repone el monto al saldo pendiente actual.
    $effect(() => {
        if (open) {
            amount = untrack(() => balance)
            submitError = ''
        }
    })

    const methodOptions: SelectOption[] = [
        { value: 'CASH', label: 'Efectivo', description: 'Abono en efectivo', icon: Banknote },
        {
            value: 'TRANSFER',
            label: 'Transferencia',
            description: 'Consignación bancaria',
            icon: ArrowLeftRight
        }
    ]
    const bankOptions = $derived<SelectOption[]>(
        banks.map((b) => ({ value: String(b.id), label: b.name }))
    )

    const amt = $derived(amount ?? 0)
    const exceeds = $derived(amt > roundTo(balance, 2))
    const canConfirm = $derived(
        !mutation.current.isPending &&
            amt > 0 &&
            !exceeds &&
            (method !== 'TRANSFER' || !!bankId)
    )

    const submit = () => {
        submitError = ''
        if (!canConfirm) return
        const bank = banks.find((b) => String(b.id) === bankId)
        const payload: ProcessCreditPaymentPayload = {
            invoice_id: invoiceId,
            payment_method: method,
            amount: amt,
            bank_id: method === 'TRANSFER' ? (bank?.id ?? null) : null,
            bank_name: method === 'TRANSFER' ? (bank?.name ?? null) : null
        }
        mutation.current.mutate(payload, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['sales', 'detail', invoiceId] })
                queryClient.invalidateQueries({ queryKey: ['sales', 'today'] })
                queryClient.invalidateQueries({ queryKey: ['reports'] })
                onClose()
            },
            onError: (e) => (submitError = getErrorMessage(e) ?? 'No se pudo registrar el abono.')
        })
    }
</script>

<BottomSheet {open} title="Hacer un abono" {onClose}>
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
            <span class="text-base font-bold tabular-nums text-warning">{formatCurrency(balance)}</span>
        </div>

        <SelectField
            label="Método del abono"
            sheetTitle="Método del abono"
            value={method}
            options={methodOptions}
            onChange={(v) => {
                method = v as 'CASH' | 'TRANSFER'
                submitError = ''
            }}
        />

        {#if method === 'TRANSFER'}
            {#if bankOptions.length > 0}
                <SelectField
                    label="Banco / cuenta"
                    sheetTitle="Selecciona la cuenta"
                    value={bankId || null}
                    options={bankOptions}
                    onChange={(v) => {
                        bankId = v
                        submitError = ''
                    }}
                    placeholder="Seleccionar cuenta"
                />
            {:else}
                <p class="text-xs text-muted-foreground">No hay cuentas configuradas.</p>
            {/if}
        {/if}

        <div>
            <MoneyInput
                label="Monto del abono"
                value={amount}
                onValueChange={(v) => {
                    amount = v
                    submitError = ''
                }}
                prefix="$ "
                error={exceeds ? 'No puede superar el saldo pendiente' : undefined}
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
            label={`Registrar abono · ${formatCurrency(amt)}`}
            icon={HandCoins}
            loading={mutation.current.isPending}
            disabled={!canConfirm}
            onclick={submit}
        />
    {/snippet}
</BottomSheet>
