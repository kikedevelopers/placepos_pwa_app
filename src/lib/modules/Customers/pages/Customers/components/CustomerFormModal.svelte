<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, X } from '@lucide/svelte'
    import type { Customer } from '$lib/api/requests/customers'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { useCustomerForm } from '../hooks/useCustomerForm.svelte'
    import CustomerFormFields from './CustomerFormFields.svelte'

    interface Props {
        customer: Customer | null
        onClose: () => void
    }
    let { customer, onClose }: Props = $props()

    // El modal se remonta por cliente vía {#key}, así que capturar el valor
    // inicial de customer/onClose es intencional (untrack silencia el aviso).
    const ctrl = untrack(() => useCustomerForm(customer, onClose))
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
            <h2 class="text-base font-bold text-foreground">
                {ctrl.isEdit ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <div class="w-10"></div>
        </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-5">
        <div class="flex flex-col gap-4">
            <CustomerFormFields form={ctrl.form} errors={ctrl.errors} />

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
            label={ctrl.isEdit ? 'Guardar cambios' : 'Crear cliente'}
            loading={ctrl.isSubmitting}
            onclick={ctrl.submit}
        />
    </div>
</div>
