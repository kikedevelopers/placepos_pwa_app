<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors'
    import { EmptyState, Segmented, SkeletonList } from '$lib/components/premium'
    import SectionHeader from './SectionHeader.svelte'
    import CompanyForm from './CompanyForm.svelte'
    import AdminInfoForm from './AdminInfoForm.svelte'
    import ConsecutivosList from './ConsecutivosList.svelte'
    import { useCompany } from '../hooks/useCompanySettings'

    let { onBack }: { onBack: () => void } = $props()

    const query = useCompany()
    const company = $derived($query.data ?? null)

    const TABS = [
        { value: 'info', label: 'Información' },
        { value: 'admin', label: 'Administrativa' },
        { value: 'consecutivos', label: 'Consecutivos' }
    ] as const
    let tab = $state<'info' | 'admin' | 'consecutivos'>('info')
</script>

<SectionHeader title="Mi negocio" subtitle="Datos y configuración del negocio" {onBack} />

<div class="flex flex-col gap-5 px-5 pb-6">
    <Segmented ariaLabel="Sección de Mi negocio" options={TABS} value={tab} onChange={(v) => (tab = v)} />

    {#if tab === 'consecutivos'}
        <ConsecutivosList />
    {:else if $query.isLoading}
        <SkeletonList rows={4} />
    {:else if $query.isError || !company}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else if tab === 'info'}
        <CompanyForm {company} />
    {:else}
        <AdminInfoForm {company} />
    {/if}
</div>
