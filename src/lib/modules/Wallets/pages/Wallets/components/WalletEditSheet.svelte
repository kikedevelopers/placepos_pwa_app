<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, Pencil } from '@lucide/svelte'
    import type { WalletAccount } from '$lib/api/requests/wallets'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { useWalletEditForm } from '../hooks/useWalletForm.svelte'

    interface Props {
        wallet: WalletAccount
        onClose: () => void
    }
    let { wallet, onClose }: Props = $props()

    const ctrl = untrack(() => useWalletEditForm(wallet, onClose))
</script>

<BottomSheet open title="Editar billetera" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <FormField
            bind:value={ctrl.form.name}
            label="Nombre de la billetera"
            placeholder="Ej: Caja principal…"
            error={ctrl.errors['name']}
            maxlength={100}
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
            label="Guardar cambios"
            icon={Pencil}
            loading={ctrl.isSubmitting}
            onclick={ctrl.submit}
        />
    {/snippet}
</BottomSheet>
