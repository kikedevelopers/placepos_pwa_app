<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import SectionHeader from './SectionHeader.svelte'
    import CompanyForm from './CompanyForm.svelte'
    import AdminInfoForm from './AdminInfoForm.svelte'
    import ConsecutivosList from './ConsecutivosList.svelte'
    import { useCompany } from '../hooks/useCompanySettings'

    let { onBack }: { onBack: () => void } = $props()

    const query = useCompany()
    const company = $derived($query.data ?? null)

    const TABS = [
        { id: 'info', label: 'Información' },
        { id: 'admin', label: 'Administrativa' },
        { id: 'consecutivos', label: 'Consecutivos' }
    ] as const
    let tab = $state<'info' | 'admin' | 'consecutivos'>('info')
</script>

<SectionHeader title="Mi negocio" subtitle="Datos y configuración del negocio" {onBack} />

<div class="flex flex-col gap-5 px-5 pb-8">
    <FilterChips options={TABS} value={tab} onChange={(v) => (tab = v as typeof tab)} />

    {#if tab === 'consecutivos'}
        <ConsecutivosList />
    {:else if $query.isLoading}
        <ScreenState kind="loading" />
    {:else if $query.isError || !company}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    {:else if tab === 'info'}
        <CompanyForm {company} />
    {:else}
        <AdminInfoForm {company} />
    {/if}
</div>
