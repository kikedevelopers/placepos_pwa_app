<script lang="ts">
    import { AlertCircle, ArrowLeftRight, Banknote, CreditCard, Info } from '@lucide/svelte'
    import type { PaymentMethod } from '$lib/api/requests/pos'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import SelectField, { type SelectOption } from '$lib/components/SelectField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { todayISO } from '$lib/utils/dates'
    import type { PaymentController } from '../hooks/usePayment.svelte'

    let { p }: { p: PaymentController } = $props()

    const methodOptions = $derived<SelectOption[]>([
        { value: 'CASH', label: 'Efectivo', description: 'Pago en efectivo con cambio', icon: Banknote },
        {
            value: 'TRANSFER',
            label: 'Transferencia',
            description: 'Transferencia bancaria',
            icon: ArrowLeftRight
        },
        {
            value: 'CREDIT',
            label: 'Crédito',
            description: p.hasCustomer ? 'Registrar con fecha de vencimiento' : 'Requiere un cliente',
            icon: CreditCard,
            disabled: !p.hasCustomer
        }
    ])

    const bankOptions = $derived<SelectOption[]>(
        p.banks.map((b) => ({ value: String(b.id), label: b.name }))
    )

    const confirmLabel = $derived(
        p.method === 'CREDIT'
            ? `Registrar a crédito`
            : p.showPartialWarning
              ? 'Continuar a pago dividido'
              : `Cobrar ${formatCurrency(p.total)}`
    )
</script>

<div class="flex flex-1 flex-col">
    <div class="flex-1 overflow-y-auto p-5">
        <div class="mx-auto flex w-full max-w-md flex-col gap-5">
            <!-- Total -->
            <div
                class="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-6 text-center"
                style="box-shadow:0 8px 20px hsla(222,47%,11%,0.06)"
            >
                <div
                    class="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-70 blur-2xl"
                    style="background:radial-gradient(circle, hsla(217,91%,50%,0.16), transparent 70%)"
                    aria-hidden="true"
                ></div>
                <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Total a cobrar · {p.order.ticket_number}
                </p>
                <p class="mt-1.5 text-4xl font-bold tracking-tight text-foreground">
                    {formatCurrency(p.total)}
                </p>
                <p class="mt-1.5 text-xs text-muted-foreground">
                    {p.order.customer_name ?? 'Consumidor final'}
                </p>
            </div>

            <!-- Método de pago (select) -->
            <SelectField
                label="Método de pago"
                sheetTitle="Selecciona el método"
                value={p.method}
                options={methodOptions}
                onChange={(v) => p.setMethod(v as PaymentMethod)}
            />

            <!-- TRANSFER: banco -->
            {#if p.method === 'TRANSFER'}
                {#if bankOptions.length > 0}
                    <SelectField
                        label="Banco / cuenta"
                        sheetTitle="Selecciona la cuenta"
                        value={p.bankId || null}
                        options={bankOptions}
                        onChange={p.setBankId}
                        placeholder="Seleccionar cuenta"
                    />
                {:else}
                    <p class="text-xs text-muted-foreground">No hay cuentas configuradas.</p>
                {/if}
            {/if}

            <!-- CASH / TRANSFER: monto -->
            {#if p.method !== 'CREDIT'}
                <div class="flex flex-col gap-2">
                    <MoneyInput
                        label={p.method === 'CASH' ? 'Monto recibido' : 'Monto'}
                        value={p.amount}
                        onValueChange={p.setAmount}
                        prefix="$ "
                    />
                    {#if p.method === 'CASH'}
                        <div
                            class="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5"
                        >
                            <span class="text-sm text-muted-foreground">Cambio</span>
                            <span class="text-base font-bold tabular-nums text-success"
                                >{formatCurrency(p.change)}</span
                            >
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- CREDIT: vencimiento -->
            {#if p.method === 'CREDIT'}
                <div class="flex flex-col gap-2">
                    <label
                        for="due-date"
                        class="ml-0.5 block text-[13px] font-semibold text-foreground/70"
                        >Vencimiento del crédito</label
                    >
                    <div
                        class="flex h-[52px] items-center rounded-[14px] px-3.5"
                        style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
                    >
                        <input
                            id="due-date"
                            type="date"
                            min={todayISO()}
                            value={p.dueDate}
                            oninput={(e) => p.setDueDate((e.currentTarget as HTMLInputElement).value)}
                            class="w-full bg-transparent text-base text-foreground outline-none"
                        />
                    </div>
                    <div
                        class="flex items-center justify-between rounded-xl px-4 py-2.5"
                        style="background-color:hsla(32,95%,44%,0.08);border:1px solid hsla(32,95%,44%,0.25)"
                    >
                        <span class="text-sm text-muted-foreground">A crédito</span>
                        <span class="text-base font-bold tabular-nums text-warning"
                            >{formatCurrency(p.simpleCredit)}</span
                        >
                    </div>
                </div>
            {/if}

            <!-- Aviso de pago parcial -->
            {#if p.showPartialWarning}
                <div
                    class="flex items-start gap-2 rounded-xl px-3 py-2.5"
                    style="background-color:hsla(217,91%,50%,0.08);border:1px solid hsla(217,91%,50%,0.22)"
                >
                    <Info size={15} color="hsl(217, 91%, 50%)" />
                    <span class="flex-1 text-xs leading-4 text-foreground/80">
                        El abono no cubre el total. Continuarás en <b>pago dividido</b> para combinar
                        métodos o enviar el resto a crédito.
                    </span>
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
    <div class="border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div class="mx-auto w-full max-w-md">
            <PrimaryButton
                label={confirmLabel}
                loading={p.isPending}
                disabled={!p.canConfirmSimple}
                onclick={p.submitSimple}
            />
        </div>
    </div>
</div>
