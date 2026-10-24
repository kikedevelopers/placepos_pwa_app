<script lang="ts">
    import { CalendarDays, Plus, Receipt, X } from '@lucide/svelte'
    import type { ExpenseListParams, ExpenseRecord } from '$lib/api/requests/expenses'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import { ConfirmSheet, EmptyState, Hero, ProgressiveList, Skeleton, SkeletonList, ToolbarChip, groupByDay, plural } from '$lib/components/premium'
    import DateRangeSheet from '$lib/modules/Reports/pages/Reports/components/DateRangeSheet.svelte'
    import { makeRange, rangeCaption, type DateRangeValue } from '$lib/modules/Reports/pages/Reports/components/dateRange'
    import { formatCurrency } from '$lib/utils/numbers'
    import { useExpenses } from '../../hooks/useExpenses'
    import { useExpensePaymentMethods } from '../../hooks/useExpensePaymentMethods'
    import { useExpenseMutations } from '../../hooks/useExpenseMutations'
    import { expenseInstant } from '../../utils/expenseRows'
    import ExpenseRow from './ExpenseRow.svelte'
    import ExpenseFormModal from './ExpenseFormModal.svelte'

    const role = useUserRole()

    let search = $state('')
    // Sin rango = todos los gastos (como antes); el chip abre el selector de periodo.
    let range = $state<DateRangeValue | null>(null)
    let rangeOpen = $state(false)
    const debouncedSearch = useDebouncedValue(() => search, 250)

    const params = $derived<ExpenseListParams>({
        search: debouncedSearch.value.trim() || undefined,
        date_from: range?.from,
        date_to: range?.to
    })

    const query = useExpenses(() => params)
    const methodsQuery = useExpensePaymentMethods()
    const { void: voidMutation } = useExpenseMutations()

    let formOpen = $state(false)
    let toVoid = $state<ExpenseRecord | null>(null)
    let voidError = $state<string | null>(null)

    const data = $derived($query.data)
    const expenses = $derived(data?.expenses ?? [])
    const hasFilters = $derived(Boolean(params.search || params.date_from || params.date_to))
    const groups = $derived(groupByDay(expenses, expenseInstant))

    const askVoid = (expense: ExpenseRecord) => {
        voidError = null
        toVoid = expense
    }
    const confirmVoid = () => {
        if (!toVoid) return
        $voidMutation.mutate(toVoid.id, {
            onSuccess: () => (toVoid = null),
            onError: (error: unknown) => {
                voidError = getErrorMessage(error) ?? 'No se pudo anular el gasto. Inténtalo de nuevo.'
            }
        })
    }
</script>

<div class="flex flex-col gap-4">
    <div class="flex items-center gap-2.5">
        <div class="min-w-0 flex-1">
            <SearchField bind:value={search} placeholder="Buscar por descripción" />
        </div>
        {#if role.canManage}
            <button
                type="button"
                onclick={() => (formOpen = true)}
                aria-label="Nuevo gasto"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_hsl(var(--primary)/0.7)] transition-transform duration-150 ease-out active:scale-[0.92]"
            >
                <Plus size={20} strokeWidth={2.5} />
            </button>
        {/if}
    </div>

    <div class="flex items-center gap-2">
        <ToolbarChip
            icon={CalendarDays}
            label={range ? rangeCaption(range) : 'Todas las fechas'}
            active={range !== null}
            onclick={() => (rangeOpen = true)}
            ariaLabel="Filtrar por fechas"
        />
        {#if range}
            <button
                type="button"
                onclick={() => (range = null)}
                aria-label="Quitar filtro de fechas"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-transform active:scale-[0.92]"
            >
                <X size={15} strokeWidth={2.4} />
            </button>
        {/if}
    </div>

    {#if $query.isLoading}
        <div class="surface px-5 pb-5 pt-[18px]">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="mt-3 h-9 w-44" />
        </div>
        <SkeletonList rows={6} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudieron cargar los gastos" message={getErrorMessage($query.error)} />
    {:else}
        <Hero
            label="Total en gastos"
            amount={data?.totalAmount ?? 0}
            caption={`${plural(data?.activeCount ?? 0, 'registro activo', 'registros activos')}${range ? ` · ${rangeCaption(range)}` : ''}`}
        />

        {#if expenses.length === 0}
            <EmptyState
                icon={Receipt}
                title={hasFilters ? 'Sin resultados' : 'Aún no hay gastos'}
                message={hasFilters ? 'No hay gastos para la búsqueda o el periodo elegido.' : 'Registra el primero con el botón +.'}
            />
        {:else}
            <ProgressiveList items={groups} step={8} resetKey={JSON.stringify(params)}>
                {#snippet children(shown)}
                    <div class="flex flex-col gap-4">
                        {#each shown as group (group.key)}
                            <section aria-label={group.label}>
                                <h3 class="mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">{group.label}</h3>
                                <div class="surface group-rows overflow-hidden">
                                    {#each group.items as expense (expense.id)}
                                        <ExpenseRow
                                            {expense}
                                            onclick={role.canVoid && !expense.is_archived ? () => askVoid(expense) : undefined}
                                        />
                                    {/each}
                                </div>
                            </section>
                        {/each}
                    </div>
                {/snippet}
            </ProgressiveList>
        {/if}
    {/if}
</div>

{#if formOpen}
    <ExpenseFormModal methods={$methodsQuery.data} onClose={() => (formOpen = false)} />
{/if}

<DateRangeSheet
    open={rangeOpen}
    value={range ?? makeRange('month')}
    onClose={() => (rangeOpen = false)}
    onApply={(v) => (range = v)}
/>

<ConfirmSheet
    open={toVoid !== null}
    title="Anular gasto"
    message={toVoid
        ? `"${toVoid.description}" por ${formatCurrency(toVoid.amount)}. Se devolverá el dinero a la fuente de donde salió. No se puede deshacer.`
        : ''}
    confirmLabel="Anular gasto"
    destructive
    loading={$voidMutation.isPending}
    error={voidError}
    onConfirm={confirmVoid}
    onClose={() => (toVoid = null)}
/>
