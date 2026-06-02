<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, X } from '@lucide/svelte'
    import type { PaymentMethod } from '$lib/api/requests/pos'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { usePosBanks } from '../hooks/usePosData'
    import { usePayment, type ChargeOrder } from '../hooks/usePayment.svelte'

    interface Props {
        order: ChargeOrder
        onClose: () => void
        onPaid: () => void
    }
    let { order, onClose, onPaid }: Props = $props()

    const METHODS: readonly { id: PaymentMethod; label: string }[] = [
        { id: 'CASH', label: 'Efectivo' },
        { id: 'TRANSFER', label: 'Transferencia' },
        { id: 'CREDIT', label: 'Crédito' }
    ]
    const DUE_OPTIONS: readonly { id: string; label: string }[] = [
        { id: '1', label: 'Mañana' },
        { id: '7', label: '7 días' },
        { id: '15', label: '15 días' },
        { id: '30', label: '30 días' }
    ]

    const banksQuery = usePosBanks()
    const banks = $derived($banksQuery.data ?? [])

    // El body se remonta por pedido vía {#key} en el host, así que capturar el
    // order/onPaid inicial es intencional (usePayment debe correr en init).
    const p = untrack(() => usePayment(order, $banksQuery.data ?? [], onPaid))
</script>

<div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="border-b border-border/70 bg-card pt-[env(safe-area-inset-top)]">
        <div class="flex items-center justify-between px-3 py-2">
            <button
                type="button"
                onclick={onClose}
                aria-label="Cerrar"
                class="flex h-10 w-10 items-center justify-center transition-opacity active:opacity-60"
            >
                <X size={22} color="hsl(215, 16%, 40%)" />
            </button>
            <h2 class="text-base font-bold text-foreground">Cobrar pedido</h2>
            <div class="w-10"></div>
        </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-5">
        <div class="flex flex-col gap-5">
            <div class="items-center rounded-2xl border border-border bg-card py-5 text-center">
                <p class="text-xs text-muted-foreground">
                    Total a cobrar · {order.ticket_number}
                </p>
                <p class="mt-1 text-3xl font-bold text-foreground">{formatCurrency(p.total)}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                    {order.customer_name ?? 'Consumidor final'}
                </p>
            </div>

            <div class="flex flex-col gap-2">
                <p class="text-[13px] font-semibold text-foreground/70">Método de pago</p>
                <FilterChips options={METHODS} value={p.method} onChange={(v) => p.setMethod(v as PaymentMethod)} />
                {#if p.isCredit && !p.hasCustomer}
                    <p class="text-xs text-warning">
                        Selecciona un cliente para registrar el crédito.
                    </p>
                {/if}
            </div>

            {#if p.method === 'CASH'}
                <div class="flex flex-col gap-2">
                    <MoneyInput
                        label="Monto recibido"
                        value={p.amountPaid}
                        onValueChange={p.setAmountPaid}
                        prefix="$ "
                    />
                    <div class="flex items-center justify-between px-1">
                        <span class="text-sm text-muted-foreground">Cambio</span>
                        <span class="text-base font-bold text-success">{formatCurrency(p.change)}</span>
                    </div>
                </div>
            {/if}

            {#if p.method === 'TRANSFER'}
                <div class="flex flex-col gap-2">
                    <p class="text-[13px] font-semibold text-foreground/70">Banco / cuenta</p>
                    {#if banks.length > 0}
                        <FilterChips
                            options={banks.map((b) => ({ id: String(b.id), label: b.name }))}
                            value={p.bankId}
                            onChange={p.setBankId}
                        />
                    {:else}
                        <p class="text-xs text-muted-foreground">No hay cuentas configuradas.</p>
                    {/if}
                </div>
            {/if}

            {#if p.isCredit}
                <div class="flex flex-col gap-2">
                    <p class="text-[13px] font-semibold text-foreground/70">
                        Vencimiento del crédito
                    </p>
                    <FilterChips options={DUE_OPTIONS} value={p.duePreset} onChange={p.setDuePreset} />
                    <div class="flex items-center justify-between px-1">
                        <span class="text-sm text-muted-foreground">A crédito</span>
                        <span class="text-base font-bold text-warning">
                            {formatCurrency(p.creditAmount)}
                        </span>
                    </div>
                </div>
            {/if}

            {#if p.submitError}
                <div
                    class="flex items-start gap-2 rounded-xl px-3 py-2.5"
                    style="background-color:hsla(0,84%,55%,0.10);border:1px solid hsla(0,84%,55%,0.30)"
                >
                    <AlertCircle size={15} color="hsl(0, 84%, 55%)" />
                    <span class="flex-1 text-xs leading-4 text-destructive">{p.submitError}</span>
                </div>
            {/if}
        </div>
    </div>

    <!-- Footer -->
    <div
        class="border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
    >
        <PrimaryButton
            label={`Confirmar · ${formatCurrency(p.total)}`}
            loading={p.isPending}
            disabled={!p.canConfirm}
            onclick={p.submit}
        />
    </div>
</div>
