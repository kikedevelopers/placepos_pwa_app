<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, Receipt, X } from '@lucide/svelte'
    import type { PaymentMethodsResponse } from '$lib/api/requests/expenses'
    import FormField from '$lib/components/FormField.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { useExpenseForm } from '../../hooks/useExpenseForm.svelte'
    import PaymentMethodSelect from './PaymentMethodSelect.svelte'

    interface Props {
        methods: PaymentMethodsResponse | undefined
        onClose: () => void
    }
    let { methods, onClose }: Props = $props()

    // El modal se monta/desmonta entero al abrir (vía {#if} en el padre), así
    // que capturar `onClose` una vez es intencional (untrack silencia el aviso).
    const ctrl = untrack(() => useExpenseForm(onClose))
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-background motion-safe:animate-slide-up">
    <!-- Header -->
    <div class="border-b border-border/70 bg-card pt-[env(safe-area-inset-top)]">
        <div class="flex items-center justify-between px-3 py-2">
            <button
                type="button"
                onclick={onClose}
                aria-label="Cerrar"
                class="flex h-10 w-10 items-center justify-center rounded-xl transition-opacity active:opacity-60"
            >
                <X size={22} color="hsl(215, 16%, 40%)" />
            </button>
            <div class="flex items-center gap-2">
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                    style="background-color:hsla(0, 84%, 55%, 0.10)"
                >
                    <Receipt size={17} color="hsl(0, 84%, 55%)" strokeWidth={2} />
                </div>
                <h2 class="text-base font-bold text-foreground">Registrar gasto</h2>
            </div>
            <div class="w-10"></div>
        </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-5">
        <div class="flex flex-col gap-4">
            <PaymentMethodSelect
                {methods}
                value={ctrl.form.source_key}
                onSelect={(key) => (ctrl.form.source_key = key)}
                error={ctrl.errors['source_key']}
            />

            <MoneyInput
                label="Monto del gasto"
                prefix="$"
                value={ctrl.form.amount || null}
                onValueChange={(v) => (ctrl.form.amount = v ?? 0)}
                placeholder="0"
                error={ctrl.errors['amount']}
            />

            <FormField
                bind:value={ctrl.form.description}
                label="Descripción del gasto"
                placeholder="Ej: Compra de materiales de limpieza"
                error={ctrl.errors['description']}
                multiline
                maxlength={255}
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
    </div>

    <!-- Footer -->
    <div
        class="border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
    >
        <PrimaryButton
            label="Registrar gasto"
            loading={ctrl.isSubmitting}
            onclick={ctrl.submit}
        />
    </div>
</div>
