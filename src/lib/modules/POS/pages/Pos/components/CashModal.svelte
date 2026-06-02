<script lang="ts">
    import { CheckCircle2, X } from '@lucide/svelte'
    import type { CloseCashPayload } from '$lib/api/requests/cash'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import { uuidv4 } from '$lib/utils/id'
    import {
        ERROR_BY_CODE,
        useCashSummary,
        useCloseCash,
        useTransferDestinations
    } from '../hooks/useCash'

    interface Props {
        visible: boolean
        onClose: () => void
    }
    let { visible, onClose }: Props = $props()

    const MODES: readonly { id: 'transfer' | 'reconcile'; label: string }[] = [
        { id: 'transfer', label: 'Trasladar excedente' },
        { id: 'reconcile', label: 'Conciliar y cerrar' }
    ]

    const summary = useCashSummary()
    const destinations = useTransferDestinations()
    const close = useCloseCash()

    let mode = $state<'transfer' | 'reconcile'>('transfer')
    let dest = $state('')
    let amount = $state<number | null>(null)
    let counted = $state<number | null>(null)
    let error = $state('')
    const opId = uuidv4()

    // Solo destinos válidos (wallet/bank; 'user' no se soporta en cloud).
    const destinationsList = $derived(
        [
            ...($destinations.data?.wallets ?? []),
            ...($destinations.data?.banks ?? [])
        ].filter((d) => d.type === 'wallet' || d.type === 'bank')
    )
    const options = $derived(destinationsList.map((d) => ({ id: String(d.id), label: d.name })))

    const submit = () => {
        error = ''
        const selected = destinationsList.find((d) => String(d.id) === dest)
        if (!selected) {
            error = 'Selecciona un destino para el excedente.'
            return
        }
        const payload: CloseCashPayload = {
            destinationType: selected.type as 'wallet' | 'bank',
            destinationId: selected.id,
            reconcile: mode === 'reconcile',
            amount_to_transfer: mode === 'transfer' ? (amount ?? 0) : 0,
            ...(mode === 'reconcile' ? { counted_amount: counted ?? 0 } : {})
        }
        $close.mutate(
            { payload, idempotencyKey: opId },
            {
                onError: (e) => {
                    const code = (e as { payload?: { code?: string } }).payload?.code
                    error =
                        (code && ERROR_BY_CODE[code]) ??
                        getErrorMessage(e) ??
                        'No se pudo cerrar la caja.'
                }
            }
        )
    }
</script>

{#if visible}
    <div class="fixed inset-0 z-50 flex flex-col bg-background motion-safe:animate-slide-up">
        <!-- Header -->
        <div
            class="flex items-center justify-between border-b border-border/70 bg-card px-3 py-2"
            style="padding-top:max(env(safe-area-inset-top),0.5rem)"
        >
            <button
                type="button"
                onclick={onClose}
                aria-label="Cerrar"
                class="flex h-10 w-10 items-center justify-center transition-opacity active:opacity-60"
            >
                <X size={22} color="hsl(215, 16%, 40%)" />
            </button>
            <span class="text-base font-bold text-foreground">Caja</span>
            <div class="w-10"></div>
        </div>

        {#if $close.data}
            <!-- Resultado -->
            <div class="flex flex-1 flex-col items-center justify-center px-8">
                <div
                    class="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                    style="background-color:hsla(158, 64%, 38%, 0.12)"
                >
                    <CheckCircle2 size={30} color="hsl(158, 64%, 38%)" strokeWidth={2} />
                </div>
                <p class="text-lg font-bold text-foreground">{$close.data.message}</p>
                <p class="mt-2 text-sm text-muted-foreground">
                    Trasladado: {formatCurrency($close.data.moved_amount)}
                </p>
                <p class="text-sm text-muted-foreground">
                    Diferencia: {formatCurrency($close.data.difference)}
                </p>
                <p class="text-sm text-muted-foreground">
                    Saldo final: {formatCurrency($close.data.new_balance)}
                </p>
                <div class="mt-5 w-full max-w-xs">
                    <PrimaryButton label="Listo" onclick={onClose} />
                </div>
            </div>
        {:else}
            <!-- Formulario -->
            <div
                class="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
                style="padding-bottom:max(env(safe-area-inset-bottom),1.25rem)"
            >
                {#if $summary.isLoading}
                    <ScreenState kind="loading" />
                {/if}
                {#if $summary.isError}
                    <ScreenState kind="error" message={getErrorMessage($summary.error)} />
                {/if}

                {#if $summary.data}
                    <div class="flex flex-row gap-3">
                        <div class="flex-1 rounded-2xl border border-border bg-card p-4">
                            <p class="text-xs text-muted-foreground">Saldo</p>
                            <p
                                class="mt-1 truncate text-base font-bold"
                                style="color:hsl(217, 91%, 50%)"
                            >
                                {formatCurrency($summary.data.balance)}
                            </p>
                        </div>
                        <div class="flex-1 rounded-2xl border border-border bg-card p-4">
                            <p class="text-xs text-muted-foreground">Base</p>
                            <p
                                class="mt-1 truncate text-base font-bold"
                                style="color:hsl(215, 16%, 40%)"
                            >
                                {formatCurrency($summary.data.base_amount)}
                            </p>
                        </div>
                        <div class="flex-1 rounded-2xl border border-border bg-card p-4">
                            <p class="text-xs text-muted-foreground">Disponible</p>
                            <p
                                class="mt-1 truncate text-base font-bold"
                                style="color:hsl(158, 64%, 38%)"
                            >
                                {formatCurrency($summary.data.available_to_move)}
                            </p>
                        </div>
                    </div>
                {/if}

                <div class="gap-2">
                    <p class="mb-2 text-[13px] font-semibold text-foreground/70">Acción</p>
                    <FilterChips options={MODES} value={mode} onChange={(v) => (mode = v as 'transfer' | 'reconcile')} />
                </div>

                <div class="gap-2">
                    <p class="mb-2 text-[13px] font-semibold text-foreground/70">
                        Destino del excedente
                    </p>
                    {#if options.length > 0}
                        <FilterChips {options} value={dest} onChange={(v) => (dest = v)} />
                    {:else}
                        <p class="text-xs text-muted-foreground">No hay destinos configurados.</p>
                    {/if}
                </div>

                {#if mode === 'transfer'}
                    <MoneyInput
                        label="Monto a trasladar"
                        value={amount}
                        onValueChange={(v) => (amount = v)}
                        prefix="$ "
                    />
                {:else}
                    <MoneyInput
                        label="Efectivo contado"
                        value={counted}
                        onValueChange={(v) => (counted = v)}
                        prefix="$ "
                    />
                {/if}

                {#if error}
                    <p class="text-xs text-destructive">{error}</p>
                {/if}

                <div class="mt-2">
                    <PrimaryButton
                        label={mode === 'reconcile' ? 'Conciliar y cerrar' : 'Trasladar'}
                        loading={$close.isPending}
                        onclick={submit}
                    />
                </div>
            </div>
        {/if}
    </div>
{/if}
