<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, AlertTriangle, Scale, Wallet } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import MovementPreview from './MovementPreview.svelte'
    import { useAdjustmentForm, type AdjustmentTarget } from '../hooks/useAdjustment.svelte'

    interface Props {
        target: AdjustmentTarget
        onClose: () => void
    }
    let { target, onClose }: Props = $props()

    const ctrl = untrack(() => useAdjustmentForm(target, onClose))

    // Input "hero": número grande centrado con formato es-CO (miles ".", decimal ",").
    let focused = $state(false)
    let raw = $state('')

    const group = (n: number) =>
        new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)

    const parse = (s: string): number | null => {
        const t = s.replace(/[^\d.,]/g, '')
        if (!t) return null
        const normalized = t.replace(/\./g, '').replace(',', '.')
        const n = Number(normalized)
        return Number.isFinite(n) ? n : null
    }

    const display = $derived(
        focused ? raw : ctrl.form.target_balance == null ? '' : group(ctrl.form.target_balance)
    )

    const handleFocus = () => {
        focused = true
        raw = ctrl.form.target_balance == null ? '' : String(ctrl.form.target_balance).replace('.', ',')
    }
    const handleInput = (e: Event) => {
        raw = (e.currentTarget as HTMLInputElement).value
        ctrl.form.target_balance = parse(raw)
    }
</script>

<BottomSheet open title="Corrección de caja — {target.name}" {onClose}>
    <div class="flex flex-col gap-3.5 pb-1">
        <!-- Hero: saldo actual + saldo objetivo + movimiento calculado -->
        <div
            class="rounded-2xl border border-border/60 px-5 pb-5 pt-4 text-center"
            style="background-image:linear-gradient(to bottom, hsla(214,32%,91%,0.45), hsla(214,32%,91%,0.10))"
        >
            <p
                class="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
                <Wallet size={13} />
                Saldo actual
                <span class="font-semibold tabular-nums text-foreground/80">
                    {formatCurrency(target.balance)}
                </span>
            </p>

            <div class="mt-3 flex items-baseline justify-center">
                <span class="text-2xl font-extrabold leading-none text-muted-foreground">$</span>
                <input
                    value={display}
                    oninput={handleInput}
                    onfocus={handleFocus}
                    onblur={() => (focused = false)}
                    inputmode="decimal"
                    placeholder="0"
                    aria-label="Saldo final deseado"
                    class="w-auto min-w-0 max-w-full bg-transparent text-center text-[34px] font-extrabold leading-none tracking-tight tabular-nums text-foreground caret-primary outline-none placeholder:text-[hsl(215,16%,72%)]"
                    style="field-sizing:content"
                />
            </div>
            <p class="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Saldo final deseado
            </p>

            {#if ctrl.errors['target_balance']}
                <p class="mt-3 text-xs font-medium text-destructive">
                    {ctrl.errors['target_balance']}
                </p>
            {:else}
                <div class="mt-3.5 flex justify-center">
                    <MovementPreview adjustment={ctrl.adjustment} />
                </div>
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

        <div
            class="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style="background-color:hsla(38,92%,50%,0.10);border:1px solid hsla(38,92%,50%,0.30)"
        >
            <AlertTriangle size={15} color="hsl(32, 95%, 44%)" strokeWidth={2} />
            <span class="flex-1 text-[11px] leading-4 text-muted-foreground">
                Este movimiento ajusta el saldo y queda registrado en el historial. Úsalo solo para
                cuadrar la caja con el conteo real.
            </span>
        </div>

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
            disabled={!ctrl.adjustment.hasChange}
            onclick={ctrl.submit}
        />
    {/snippet}
</BottomSheet>
