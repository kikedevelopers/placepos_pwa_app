<script lang="ts">
    import { CalendarRange, Plus, Receipt, Wallet } from '@lucide/svelte'
    import type { ExpenseListParams, ExpenseRecord } from '$lib/api/requests/expenses'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { useExpenses } from '../../hooks/useExpenses'
    import { useExpensePaymentMethods } from '../../hooks/useExpensePaymentMethods'
    import { useExpenseMutations } from '../../hooks/useExpenseMutations'
    import ExpenseCard from './ExpenseCard.svelte'
    import ExpenseFormModal from './ExpenseFormModal.svelte'

    // Sin props: el componente es autocontenido (lo monta el tab container de
    // Gastos sin pasarle nada). Si en el futuro hiciera falta inyectar filtros
    // iniciales, se añadirían como props opcionales sin romper el montaje.

    const role = useUserRole()

    let search = $state('')
    let dateFrom = $state('')
    let dateTo = $state('')
    const debouncedSearch = useDebouncedValue(() => search, 250)

    // Params reactivos: el getter alimenta el queryKey de useExpenses, así que la
    // lista refetchea al cambiar búsqueda (debounced) o rango de fechas.
    const params = $derived<ExpenseListParams>({
        search: debouncedSearch.value.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
    })

    const query = useExpenses(() => params)
    const methodsQuery = useExpensePaymentMethods()
    const { void: voidMutation } = useExpenseMutations()
    const voidStore = $derived($voidMutation)

    let formOpen = $state(false)

    const data = $derived($query.data)
    const expenses = $derived(data?.expenses ?? [])
    const totalAmount = $derived(data?.totalAmount ?? 0)
    const activeCount = $derived(data?.activeCount ?? 0)
    const hasFilters = $derived(Boolean(params.search || params.date_from || params.date_to))

    const openCreate = () => {
        formOpen = true
    }

    const handleVoid = (expense: ExpenseRecord) => {
        if (!role.canVoid) return
        const ok =
            typeof window !== 'undefined' &&
            window.confirm(
                '¿Anular este gasto? Se revertirá el balance de la fuente. Esta acción no se puede deshacer.'
            )
        if (!ok) return
        voidStore.mutate(expense.id, {
            onError: (error: unknown) => {
                const message =
                    getErrorMessage(error) ?? 'No se pudo anular el gasto. Inténtalo de nuevo.'
                if (typeof window !== 'undefined') window.alert(message)
            }
        })
    }
</script>

<div class="flex flex-1 flex-col gap-3 px-5 pb-8 pt-4">
    <!-- Buscador + botón nuevo gasto -->
    <div class="flex gap-3">
        <div class="flex-1">
            <SearchField bind:value={search} placeholder="Buscar por descripción" />
        </div>
        {#if role.canManage}
            <button
                type="button"
                onclick={openCreate}
                aria-label="Nuevo gasto"
                class="flex h-11 w-11 items-center justify-center rounded-xl transition-transform active:scale-[0.97]"
                style="background:linear-gradient(135deg, hsl(0,84%,60%), hsl(0,72%,51%))"
            >
                <Plus size={22} color="white" strokeWidth={2.5} />
            </button>
        {/if}
    </div>

    <!-- KPIs premium: Total en gastos / Registros activos (overlay radial) -->
    <div class="grid grid-cols-2 gap-3">
        <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card p-4"
            style="box-shadow:0 6px 14px hsla(222,47%,11%,0.05)"
        >
            <div
                class="pointer-events-none absolute inset-0"
                style="background:radial-gradient(120% 120% at 0% 0%, hsla(0,84%,60%,0.18), transparent 60%)"
            ></div>
            <div class="relative flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Total en gastos
                    </p>
                    <p
                        class="mt-1.5 truncate text-lg font-bold tabular-nums text-foreground"
                        title={formatCurrency(totalAmount)}
                    >
                        {formatCurrency(totalAmount, 0)}
                    </p>
                </div>
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style="background-color:hsla(0,0%,100%,0.65);backdrop-filter:blur(4px)"
                >
                    <Receipt size={16} color="hsl(0, 84%, 55%)" strokeWidth={2} />
                </div>
            </div>
        </div>

        <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card p-4"
            style="box-shadow:0 6px 14px hsla(222,47%,11%,0.05)"
        >
            <div
                class="pointer-events-none absolute inset-0"
                style="background:radial-gradient(120% 120% at 0% 0%, hsla(217,91%,55%,0.18), transparent 60%)"
            ></div>
            <div class="relative flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Registros activos
                    </p>
                    <p class="mt-1.5 truncate text-lg font-bold tabular-nums text-foreground">
                        {activeCount}
                    </p>
                </div>
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style="background-color:hsla(0,0%,100%,0.65);backdrop-filter:blur(4px)"
                >
                    <Wallet size={16} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </div>
            </div>
        </div>
    </div>

    <!-- Rango de fechas -->
    <div class="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <CalendarRange size={16} color="hsl(215, 16%, 55%)" strokeWidth={2} />
        <input
            type="date"
            bind:value={dateFrom}
            aria-label="Desde"
            class="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none"
        />
        <span class="text-xs text-muted-foreground">—</span>
        <input
            type="date"
            bind:value={dateTo}
            aria-label="Hasta"
            class="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none"
        />
        {#if dateFrom || dateTo}
            <button
                type="button"
                onclick={() => {
                    dateFrom = ''
                    dateTo = ''
                }}
                class="text-[11px] font-semibold text-primary transition-opacity active:opacity-60"
            >
                Limpiar
            </button>
        {/if}
    </div>

    <!-- Estado / lista -->
    {#if $query.isLoading}
        <ScreenState kind="loading" />
    {:else if $query.isError}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    {:else if expenses.length === 0}
        <ScreenState
            kind="empty"
            message={hasFilters
                ? 'Sin gastos para los filtros aplicados.'
                : 'Aún no hay gastos registrados. Crea el primero.'}
        />
    {:else}
        {#each expenses as expense (expense.id)}
            <ExpenseCard
                {expense}
                canVoid={role.canVoid}
                voiding={voidStore.isPending}
                onVoid={handleVoid}
            />
        {/each}
    {/if}
</div>

{#if formOpen}
    <ExpenseFormModal methods={$methodsQuery.data} onClose={() => (formOpen = false)} />
{/if}
