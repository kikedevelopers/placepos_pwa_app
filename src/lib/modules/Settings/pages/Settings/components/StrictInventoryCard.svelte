<script lang="ts">
    import { PackageCheck } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import Spinner from '$lib/components/Spinner.svelte'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import StatusBanner from '$lib/components/StatusBanner.svelte'
    import { useStrictInventory, useUpdateStrictInventory } from '../hooks/usePosSettings'

    /** El PUT exige owner|superadmin en pos_api; `canManage` aquí = canVoid. */
    let { canManage }: { canManage: boolean } = $props()

    const query = useStrictInventory()
    const update = useUpdateStrictInventory()

    // Estado optimista local: refleja el toggle al instante, rollback si falla.
    let optimistic = $state<boolean | null>(null)
    let errorMsg = $state('')

    const enabled = $derived(optimistic ?? $query.data?.enabled ?? false)
    const busy = $derived($query.isLoading || $update.isPending)

    const change = (next: boolean) => {
        if (!canManage) return
        errorMsg = ''
        optimistic = next
        $update.mutate(
            { enabled: next },
            {
                onSuccess: () => (optimistic = null),
                onError: (e) => {
                    optimistic = null
                    errorMsg = getErrorMessage(e) ?? 'No se pudo guardar la configuración.'
                }
            }
        )
    }
</script>

<div class="rounded-2xl border border-border bg-card p-4">
    <div class="flex items-center gap-3">
        <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style="background-color:hsla(158,64%,38%,0.12)"
        >
            <PackageCheck size={20} color="hsl(158, 64%, 40%)" strokeWidth={2} />
        </span>
        <div class="min-w-0 flex-1">
            <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Inventario
            </p>
            <p class="text-sm font-bold text-foreground">Control estricto de stock</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
            {#if busy}
                <Spinner size={16} />
            {/if}
            <ToggleSwitch
                variant="bare"
                tone="success"
                checked={enabled}
                onChange={change}
                disabled={!canManage || busy}
                ariaLabel="Control estricto de stock"
            />
        </div>
    </div>

    <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
        {#if enabled}
            Activo: las ventas con stock insuficiente quedan bloqueadas. Un administrador puede
            autorizarlas caso a caso.
        {:else}
            Inactivo: las ventas se procesan aunque el stock quede en negativo. Recomendado si tu
            negocio no maneja inventario.
        {/if}
    </p>

    {#if !canManage}
        <p class="mt-2 text-[11px] text-muted-foreground">
            Solo el propietario puede cambiar esta opción.
        </p>
    {/if}

    {#if errorMsg}
        <div class="mt-3">
            <StatusBanner kind="error" message={errorMsg} />
        </div>
    {/if}
</div>
