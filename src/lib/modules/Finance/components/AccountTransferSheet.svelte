<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, ArrowRightLeft, Wallet } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { useAccountTransfer, type TransferSource } from '../hooks/useAccountTransfer.svelte'

    interface Props {
        source: TransferSource
        onClose: () => void
    }
    let { source, onClose }: Props = $props()

    const ctrl = untrack(() => useAccountTransfer(source, onClose))

    const TYPE_LABEL: Record<string, string> = {
        user: 'Caja de usuario',
        wallet: 'Billetera',
        bank: 'Banco'
    }
</script>

<BottomSheet open title="Mover saldo" {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <!-- Saldo disponible en la fuente -->
        <div
            class="rounded-2xl border border-success/20 bg-success/10 px-4 py-3.5 text-center"
        >
            <div class="flex items-center justify-center gap-1.5">
                <Wallet size={14} color="hsl(158, 64%, 42%)" strokeWidth={2.2} />
                <p class="text-xs font-medium text-success">Saldo disponible</p>
            </div>
            <p class="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(source.balance)}
            </p>
            <p class="mt-0.5 text-[11px] text-muted-foreground">{source.name}</p>
        </div>

        <!-- Destino -->
        <div>
            <label
                for="transfer-destination"
                class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
            >
                Destino
            </label>
            <div class="relative">
                <span
                    class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                    <ArrowRightLeft size={16} strokeWidth={2} />
                </span>
                <select
                    id="transfer-destination"
                    bind:value={ctrl.selectedKey}
                    disabled={!ctrl.hasDestinations || ctrl.isLoadingDestinations}
                    class="h-[52px] w-full appearance-none rounded-[14px] border-[1.5px] border-border bg-card pl-10 pr-4 text-base text-foreground outline-none focus:border-primary disabled:opacity-60"
                >
                    <option value="" disabled>
                        {ctrl.isLoadingDestinations
                            ? 'Cargando destinos…'
                            : ctrl.hasDestinations
                              ? 'Selecciona un destino'
                              : 'Sin destinos disponibles'}
                    </option>
                    {#if ctrl.grouped.users.length > 0}
                        <optgroup label="Cajas de usuarios">
                            {#each ctrl.grouped.users as u (u.id)}
                                <option value={`user:${u.id}`}>{u.name}</option>
                            {/each}
                        </optgroup>
                    {/if}
                    {#if ctrl.grouped.wallets.length > 0}
                        <optgroup label="Billeteras">
                            {#each ctrl.grouped.wallets as w (w.id)}
                                <option value={`wallet:${w.id}`}>{w.name}</option>
                            {/each}
                        </optgroup>
                    {/if}
                    {#if ctrl.grouped.banks.length > 0}
                        <optgroup label="Bancos">
                            {#each ctrl.grouped.banks as b (b.id)}
                                <option value={`bank:${b.id}`}>{b.name}</option>
                            {/each}
                        </optgroup>
                    {/if}
                </select>
            </div>

            {#if ctrl.selectedDestination}
                <div class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                        class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                    >
                        {TYPE_LABEL[ctrl.selectedDestination.type]}
                    </span>
                    <span>·</span>
                    <span>Saldo actual: {formatCurrency(ctrl.selectedDestination.balance)}</span>
                </div>
            {/if}
        </div>

        <!-- Monto -->
        <div>
            <MoneyInput
                label="Monto a transferir"
                prefix="$"
                value={ctrl.amount}
                onValueChange={(v) => (ctrl.amount = v)}
                placeholder="0"
                error={ctrl.insufficient ? 'Saldo insuficiente' : undefined}
            />
            {#if ctrl.insufficient}
                <p class="ml-0.5 mt-1.5 text-xs text-destructive">
                    Saldo insuficiente. Disponible: {formatCurrency(source.balance)}
                </p>
            {/if}
        </div>

        <!-- Vista previa -->
        {#if ctrl.amount && ctrl.amount > 0 && ctrl.selectedDestination && !ctrl.insufficient}
            <div class="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Vista previa
                </p>
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Nuevo saldo en {source.name}</span>
                    <span class="font-semibold tabular-nums text-foreground">
                        {formatCurrency(ctrl.newSourceBalance)}
                    </span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="truncate text-muted-foreground">
                        Nuevo saldo en {ctrl.selectedDestination.name}
                    </span>
                    <span class="font-semibold tabular-nums text-success">
                        {formatCurrency(ctrl.newDestinationBalance)}
                    </span>
                </div>
            </div>
        {/if}

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
            label="Transferir"
            icon={ArrowRightLeft}
            loading={ctrl.isSubmitting}
            disabled={!ctrl.canSubmit}
            onclick={ctrl.submit}
        />
    {/snippet}
</BottomSheet>
