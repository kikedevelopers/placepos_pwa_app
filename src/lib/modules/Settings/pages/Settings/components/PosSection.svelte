<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import { EmptyState, Segmented, SkeletonList } from '$lib/components/premium'
    import SectionHeader from './SectionHeader.svelte'
    import StrictInventoryCard from './StrictInventoryCard.svelte'
    import IncludeOrdersInReportsCard from './IncludeOrdersInReportsCard.svelte'
    import PosMarginsForm from './PosMarginsForm.svelte'
    import { usePosMargins } from '../hooks/usePosSettings'

    let { onBack }: { onBack: () => void } = $props()

    const role = useUserRole()
    const marginsQuery = usePosMargins()
    const config = $derived($marginsQuery.data ?? null)

    // Sub-tabs: Punto de Venta (config del POS) | Reportes (config de informes).
    let sub = $state<'pos' | 'reports'>('pos')
</script>

<SectionHeader title="P.O.S" subtitle="Punto de venta e informes" {onBack} />

<div class="flex flex-col gap-4 px-5 pb-6">
    <Segmented
        ariaLabel="Sección del P.O.S"
        options={[
            { value: 'pos', label: 'Punto de venta' },
            { value: 'reports', label: 'Reportes' }
        ]}
        value={sub}
        onChange={(v) => (sub = v)}
    />

    {#if sub === 'pos'}
        <StrictInventoryCard canManage={role.canVoid} />

        {#if $marginsQuery.isLoading}
            <SkeletonList rows={3} />
        {:else if $marginsQuery.isError || !config}
            <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($marginsQuery.error)} />
        {:else}
            <PosMarginsForm {config} />
        {/if}
    {:else}
        <IncludeOrdersInReportsCard canManage={role.canVoid} />
    {/if}
</div>
