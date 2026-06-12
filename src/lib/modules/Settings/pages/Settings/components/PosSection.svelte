<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import SectionHeader from './SectionHeader.svelte'
    import StrictInventoryCard from './StrictInventoryCard.svelte'
    import PosMarginsForm from './PosMarginsForm.svelte'
    import { usePosMargins } from '../hooks/usePosSettings'

    let { onBack }: { onBack: () => void } = $props()

    const role = useUserRole()
    const marginsQuery = usePosMargins()
    const config = $derived($marginsQuery.data ?? null)
</script>

<SectionHeader title="P.O.S" subtitle="Punto de venta e inventario" {onBack} />

<div class="flex flex-col gap-4 px-5 pb-8">
    <StrictInventoryCard canManage={role.canVoid} />

    {#if $marginsQuery.isLoading}
        <ScreenState kind="loading" />
    {:else if $marginsQuery.isError || !config}
        <ScreenState kind="error" message={getErrorMessage($marginsQuery.error)} />
    {:else}
        <PosMarginsForm {config} />
    {/if}
</div>
