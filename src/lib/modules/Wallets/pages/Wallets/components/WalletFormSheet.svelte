<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, Wallet } from '@lucide/svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { useWalletCreateForm } from '../hooks/useWalletForm.svelte'

    interface Props {
        onClose: () => void
    }
    let { onClose }: Props = $props()

    const ctrl = untrack(() => useWalletCreateForm(onClose))
</script>

<BottomSheet open title="Nueva billetera" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <FormField
            bind:value={ctrl.form.name}
            label="Nombre de la billetera"
            placeholder="Ej: Caja Mayor, Ahorros…"
            error={ctrl.errors['name']}
            maxlength={100}
        />

        <MoneyInput
            label="Saldo inicial"
            prefix="$"
            value={ctrl.form.initial_balance || null}
            onValueChange={(v) => (ctrl.form.initial_balance = v ?? 0)}
            placeholder="0"
            error={ctrl.errors['initial_balance']}
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
            label="Registrar billetera"
            icon={Wallet}
            loading={ctrl.isSubmitting}
            onclick={ctrl.submit}
        />
    {/snippet}
</BottomSheet>
