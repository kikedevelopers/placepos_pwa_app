<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight, Scale } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { MOVEMENT_TYPE } from '../schemas/adjustment.schema'
    import { useAdjustmentForm, type AdjustmentTarget } from '../hooks/useAdjustment.svelte'

    interface Props {
        target: AdjustmentTarget
        onClose: () => void
    }
    let { target, onClose }: Props = $props()

    const ctrl = untrack(() => useAdjustmentForm(target, onClose))
    const isIncome = $derived(ctrl.form.movement_type === MOVEMENT_TYPE.INCOME)
</script>

<BottomSheet open title="Corrección de caja — {target.name}" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <p class="text-xs text-muted-foreground">
            Saldo actual:
            <span class="font-semibold tabular-nums text-foreground">
                {formatCurrency(target.balance)}
            </span>
        </p>

        <div
            class="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style="background-color:hsla(38,92%,50%,0.10);border:1px solid hsla(38,92%,50%,0.30)"
        >
            <AlertTriangle size={15} color="hsl(32, 95%, 44%)" strokeWidth={2} />
            <span class="flex-1 text-[11px] leading-4 text-muted-foreground">
                Este movimiento ajusta el saldo y queda registrado. Úsalo solo para cuadrar la caja
                con el conteo real.
            </span>
        </div>

        <!-- Segmented: Ingreso (suma) / Egreso (resta) -->
        <div class="grid grid-cols-2 gap-2.5">
            <button
                type="button"
                aria-pressed={isIncome}
                onclick={() => (ctrl.form.movement_type = MOVEMENT_TYPE.INCOME)}
                class="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors duration-150 {isIncome
                    ? 'border-success/50 bg-success/10 text-success'
                    : 'border-border bg-card text-muted-foreground'}"
            >
                <ArrowDownLeft size={16} strokeWidth={2.2} />
                Ingreso (suma)
            </button>
            <button
                type="button"
                aria-pressed={!isIncome}
                onclick={() => (ctrl.form.movement_type = MOVEMENT_TYPE.EXPENSE)}
                class="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors duration-150 {!isIncome
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : 'border-border bg-card text-muted-foreground'}"
            >
                <ArrowUpRight size={16} strokeWidth={2.2} />
                Egreso (resta)
            </button>
        </div>

        <div>
            <MoneyInput
                label="Monto del ajuste"
                prefix="$"
                value={ctrl.form.amount || null}
                onValueChange={(v) => (ctrl.form.amount = v ?? 0)}
                placeholder="0"
                error={ctrl.errors['amount']}
            />
            {#if ctrl.balanceExceeded}
                <p class="ml-0.5 mt-1.5 text-xs text-destructive">
                    El monto excede el saldo disponible.
                </p>
            {/if}
        </div>

        <FormField
            bind:value={ctrl.form.description}
            label="Motivo del ajuste"
            placeholder="Ej: cuadre con conteo físico, depósito no registrado…"
            error={ctrl.errors['description']}
            multiline
            maxlength={280}
        />

        {#if ctrl.submitError}
            <div
                class="flex items-start gap-2 rounded-xl px-3 py-2.5"
                style="background-color:hsla(0,84%,55%,0.10);border:1px solid hsla(0,84%,55%,0.30)"
            >
                <AlertCircle size={15} color="hsl(0, 84%, 55%)" />
                <span class="flex-1 text-xs leading-4 text-destructive">{ctrl.submitError}</span>
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <PrimaryButton
            label="Aplicar corrección"
            icon={Scale}
            loading={ctrl.isSubmitting}
            disabled={ctrl.balanceExceeded}
            onclick={ctrl.submit}
        />
    {/snippet}
</BottomSheet>
