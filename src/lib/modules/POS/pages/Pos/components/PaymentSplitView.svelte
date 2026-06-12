<script lang="ts">
    import { untrack } from 'svelte'
    import {
        AlertCircle,
        ArrowLeftRight,
        Banknote,
        Plus,
        X
    } from '@lucide/svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import SelectField, { type SelectOption } from '$lib/components/SelectField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { PaymentController } from '../hooks/usePayment.svelte'

    let { p }: { p: PaymentController } = $props()

    // ---- Formulario para agregar un abono ----
    let addMethod = $state<'CASH' | 'TRANSFER'>('CASH')
    let addAmount = $state<number | null>(untrack(() => p.remaining))
    let addBankId = $state('')

    const addMethodOptions = $derived<SelectOption[]>([
        ...(p.canAddCash ? [{ value: 'CASH', label: 'Efectivo', icon: Banknote }] : []),
        ...(p.canAddTransfer
            ? [{ value: 'TRANSFER', label: 'Transferencia', icon: ArrowLeftRight }]
            : [])
    ])

    // Mantiene `addMethod` en una opción válida cuando cambian las disponibles.
    $effect(() => {
        if (addMethodOptions.length > 0 && !addMethodOptions.some((o) => o.value === addMethod)) {
            addMethod = addMethodOptions[0].value as 'CASH' | 'TRANSFER'
        }
    })

    const availableBankOptions = $derived<SelectOption[]>(
        p.availableBanks.map((b) => ({ value: String(b.id), label: b.name }))
    )

    const pct = $derived(p.total > 0 ? Math.min(100, (p.covered / p.total) * 100) : 0)

    const canAdd = $derived(
        (addAmount ?? 0) > 0 && (addMethod !== 'TRANSFER' || !!addBankId)
    )

    const handleAdd = () => {
        const amt = addAmount ?? 0
        if (amt <= 0) return
        if (addMethod === 'TRANSFER') {
            const bank = p.availableBanks.find((b) => String(b.id) === addBankId)
            if (!bank) return
            p.addTender('TRANSFER', amt, bank)
        } else {
            p.addTender('CASH', amt)
        }
        addBankId = ''
        addAmount = p.remaining > 0 ? p.remaining : null
    }
</script>

<div class="flex flex-1 flex-col">
    <div class="flex-1 overflow-y-auto p-5">
        <div class="mx-auto flex w-full max-w-md flex-col gap-5">
            <!-- Progreso -->
            <div
                class="rounded-3xl border border-border bg-card p-5"
                style="box-shadow:0 8px 20px hsla(222,47%,11%,0.06)"
            >
                <div class="flex items-end justify-between">
                    <div>
                        <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Restante
                        </p>
                        <p
                            class="mt-1 text-3xl font-bold tracking-tight {p.isFullyCovered
                                ? 'text-success'
                                : 'text-foreground'}"
                        >
                            {formatCurrency(p.remaining)}
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-[11px] text-muted-foreground">
                            Cubierto {formatCurrency(p.covered)}
                        </p>
                        <p class="text-[11px] text-muted-foreground">
                            de {formatCurrency(p.total)}
                        </p>
                    </div>
                </div>
                <div class="mt-3 h-2 w-full overflow-hidden rounded-full" style="background-color:hsl(214,32%,91%)">
                    <div
                        class="h-full rounded-full transition-all duration-300"
                        style="width:{pct}%;background:linear-gradient(90deg, hsl(213,94%,58%), hsl(217,91%,50%))"
                    ></div>
                </div>
            </div>

            <!-- Lista de tenders -->
            {#if p.tenders.length > 0}
                <div class="flex flex-col gap-2.5">
                    {#each p.tenders as t (t.id)}
                        <div
                            class="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
                        >
                            <span
                                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style="background-color:hsla(217,91%,50%,0.12)"
                            >
                                {#if t.payment_method === 'CASH'}
                                    <Banknote size={17} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                                {:else}
                                    <ArrowLeftRight size={17} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                                {/if}
                            </span>
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-semibold text-foreground">
                                    {t.payment_method === 'CASH' ? 'Efectivo' : t.bank_name ?? 'Transferencia'}
                                </p>
                                {#if t.change_amount > 0}
                                    <p class="text-[11px] text-muted-foreground">
                                        Recibido {formatCurrency(t.amount_paid)} · cambio
                                        {formatCurrency(t.change_amount)}
                                    </p>
                                {/if}
                            </div>
                            <span class="shrink-0 text-sm font-bold tabular-nums text-foreground">
                                {formatCurrency(t.amount_paid - t.change_amount)}
                            </span>
                            <button
                                type="button"
                                onclick={() => p.removeTender(t.id)}
                                aria-label="Quitar"
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:opacity-60"
                            >
                                <X size={16} strokeWidth={2.2} />
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Agregar abono -->
            {#if !p.isFullyCovered && addMethodOptions.length > 0}
                <div class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                    <p class="text-[13px] font-semibold text-foreground/70">Agregar abono</p>
                    <SelectField
                        sheetTitle="Método del abono"
                        value={addMethod}
                        options={addMethodOptions}
                        onChange={(v) => (addMethod = v as 'CASH' | 'TRANSFER')}
                    />
                    {#if addMethod === 'TRANSFER'}
                        <SelectField
                            sheetTitle="Selecciona la cuenta"
                            value={addBankId || null}
                            options={availableBankOptions}
                            onChange={(v) => (addBankId = v)}
                            placeholder="Seleccionar cuenta"
                        />
                    {/if}
                    <MoneyInput value={addAmount} onValueChange={(v) => (addAmount = v)} prefix="$ " />
                    <PressableScale onclick={handleAdd} disabled={!canAdd} class="block w-full">
                        <span
                            class="flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] border border-primary/40 text-sm font-bold text-primary {canAdd
                                ? ''
                                : 'opacity-50'}"
                            style="background-color:hsla(217,91%,50%,0.06)"
                        >
                            <Plus size={17} strokeWidth={2.4} />
                            Agregar abono
                        </span>
                    </PressableScale>
                </div>
            {/if}

            <!-- Vencimiento (cuando el resto irá a crédito) -->
            {#if !p.isFullyCovered && p.canUseCredit}
                <div class="flex flex-col gap-2">
                    <label
                        for="split-due"
                        class="ml-0.5 block text-[13px] font-semibold text-foreground/70"
                        >Vencimiento del crédito (resto)</label
                    >
                    <div
                        class="flex h-[52px] items-center rounded-[14px] px-3.5"
                        style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
                    >
                        <input
                            id="split-due"
                            type="date"
                            value={p.dueDate}
                            oninput={(e) => p.setDueDate((e.currentTarget as HTMLInputElement).value)}
                            class="w-full bg-transparent text-base text-foreground outline-none"
                        />
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
    <div class="border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div class="mx-auto w-full max-w-md">
            {#if p.isFullyCovered}
                <PrimaryButton
                    label={`Cobrar ${formatCurrency(p.total)}`}
                    loading={p.isPending}
                    onclick={p.finalizeCovered}
                />
            {:else if p.canUseCredit}
                <PrimaryButton
                    label={`Enviar resto a crédito · ${formatCurrency(p.remaining)}`}
                    loading={p.isPending}
                    onclick={p.finalizeWithCredit}
                />
            {:else}
                <p class="py-2 text-center text-xs text-muted-foreground">
                    Agrega abonos hasta cubrir el total{p.hasCustomer
                        ? ''
                        : ' (sin cliente no se puede enviar a crédito)'}.
                </p>
            {/if}
        </div>
    </div>
</div>
