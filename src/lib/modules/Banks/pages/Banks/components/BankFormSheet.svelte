<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, Landmark } from '@lucide/svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { useBankCreateForm } from '../hooks/useBankForm.svelte'
    import AccountTypeField from './AccountTypeField.svelte'
    import PosToggleField from './PosToggleField.svelte'

    interface Props {
        onClose: () => void
    }
    let { onClose }: Props = $props()

    const ctrl = untrack(() => useBankCreateForm(onClose))
</script>

<BottomSheet open title="Nueva cuenta bancaria" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <FormField
            bind:value={ctrl.form.name}
            label="Entidad bancaria"
            placeholder="Ej: Bancolombia, Davivienda…"
            error={ctrl.errors['name']}
            maxlength={100}
        />

        <FormField
            bind:value={ctrl.form.account_number}
            label="Número de cuenta"
            placeholder="Ej: 0012345678"
            error={ctrl.errors['account_number']}
            inputmode="numeric"
            autocapitalize="none"
            maxlength={100}
        />

        <AccountTypeField
            value={ctrl.form.account_type}
            onChange={(v) => (ctrl.form.account_type = v)}
            error={ctrl.errors['account_type']}
        />

        <MoneyInput
            label="Saldo inicial"
            prefix="$"
            value={ctrl.form.initial_balance || null}
            onValueChange={(v) => (ctrl.form.initial_balance = v ?? 0)}
            placeholder="0"
            error={ctrl.errors['initial_balance']}
        />

        <PosToggleField
            checked={ctrl.form.available_in_pos}
            onChange={(v) => (ctrl.form.available_in_pos = v)}
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
            label="Registrar cuenta"
            icon={Landmark}
            loading={ctrl.isSubmitting}
            onclick={ctrl.submit}
        />
    {/snippet}
</BottomSheet>
