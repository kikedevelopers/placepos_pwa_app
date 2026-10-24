<script lang="ts">
    import { HandCoins } from '@lucide/svelte'
    import type { CreditStatusFilter } from '$lib/api/requests/reports'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import { EmptyState, Hero, Metrics, ProgressiveList, Segmented, Skeleton, SkeletonList, plural } from '$lib/components/premium'
    import { useCreditsReport } from '../hooks/useCreditsReport'
    import CreditRow from '../components/CreditRow.svelte'

    // Mismos filtros que la Cartera de placepos; por defecto lo que se debe.
    const STATUS_OPTIONS = [
        { value: 'OWED', label: 'Por cobrar' },
        { value: 'OVERDUE', label: 'Vencidos' },
        { value: 'PAID', label: 'Pagados' },
        { value: 'ALL', label: 'Todos' }
    ] as const satisfies readonly { value: CreditStatusFilter; label: string }[]

    type StatusValue = (typeof STATUS_OPTIONS)[number]['value']

    let status = $state<StatusValue>('OWED')
    let searchInput = $state('')
    const debounced = useDebouncedValue(() => searchInput)

    const query = useCreditsReport(() => ({ status, search: debounced.value || undefined }))
    const summary = $derived($query.data?.summary)
    const credits = $derived($query.data?.credits ?? [])

    const emptyCopy: Record<StatusValue, string> = {
        OWED: 'Nadie te debe en este momento.',
        OVERDUE: 'No hay créditos vencidos. Todo al día.',
        PAID: 'Aún no hay créditos pagados.',
        ALL: 'Todavía no hay ventas a crédito.'
    }
</script>

<div class="flex flex-col gap-4 px-5 pb-6 pt-2">
    <Segmented ariaLabel="Estado de los créditos" options={STATUS_OPTIONS} value={status} onChange={(v) => (status = v)} />

    {#if $query.isLoading}
        <div class="surface px-5 pb-5 pt-[18px]">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="mt-3 h-9 w-44" />
        </div>
    {:else if summary}
        <Hero
            label="Saldo por cobrar"
            amount={summary.total_balance}
            caption={plural(summary.total_credits_count, 'crédito')}
        />
        <Metrics
            ariaLabel="Resumen de la cartera"
            items={[
                { label: 'Monto total', amount: summary.total_amount },
                { label: 'Total abonado', amount: summary.total_paid, tone: summary.total_paid > 0 ? 'positive' : 'neutral' },
                { label: 'Sin abonos', text: summary.pending_count.toLocaleString('es-CO'), tone: summary.pending_count > 0 ? 'warning' : 'neutral' },
                { label: 'Con abonos', text: summary.partial_count.toLocaleString('es-CO'), hint: plural(summary.paid_count, 'pagado') }
            ]}
        />
    {/if}

    <SearchField bind:value={searchInput} placeholder="Buscar cliente o nº de ticket" />

    {#if $query.isLoading}
        <SkeletonList rows={6} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else if credits.length === 0}
        <EmptyState
            icon={HandCoins}
            title={debounced.value ? 'Sin resultados' : 'Sin créditos'}
            message={debounced.value ? 'Prueba con otro nombre o número.' : emptyCopy[status]}
        />
    {:else}
        <ProgressiveList items={credits} resetKey={`${status}|${debounced.value}`}>
            {#snippet children(shown)}
                <div class="surface group-rows overflow-hidden">
                    {#each shown as credit (credit.id)}
                        <CreditRow {credit} />
                    {/each}
                </div>
            {/snippet}
        </ProgressiveList>
    {/if}
</div>
