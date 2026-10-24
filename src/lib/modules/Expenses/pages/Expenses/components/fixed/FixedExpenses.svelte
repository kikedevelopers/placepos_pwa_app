<script lang="ts">
    import { Plus } from '@lucide/svelte'
    import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import { ConfirmSheet, EmptyState, SkeletonList } from '$lib/components/premium'
    import { useFixedExpenses } from '../../hooks/useFixedExpenses'
    import { useLiveTick } from '../../hooks/useLiveTick.svelte'
    import { useFixedExpensesSummary } from '../../hooks/useFixedExpensesSummary.svelte'
    import { useFixedExpenseMutations } from '../../hooks/useFixedExpenseMutations'
    import FixedExpensesSummary from './FixedExpensesSummary.svelte'
    import FixedExpenseCard from './FixedExpenseCard.svelte'
    import FixedExpensesEmpty from './FixedExpensesEmpty.svelte'
    import FixedExpenseFormModal from './FixedExpenseFormModal.svelte'

    const role = useUserRole()

    // Re-render cada 3s: sensación "viva" del devengo sin recalcular Big.js × N
    // gastos cada segundo. Nunca lee la hora del sistema en SSR.
    const tick = useLiveTick(3000)

    const query = useFixedExpenses()
    const expenses = $derived($query.data ?? [])

    const summary = useFixedExpensesSummary(
        () => expenses,
        () => tick.now
    )

    const { archive } = useFixedExpenseMutations()

    let formOpen = $state(false)
    let editing = $state<FixedExpense | null>(null)

    const openCreate = () => {
        if (!role.canManage) return
        editing = null
        formOpen = true
    }
    const openEdit = (expense: FixedExpense) => {
        if (!role.canManage) return
        editing = expense
        formOpen = true
    }

    let toArchive = $state<FixedExpense | null>(null)
    let archiveError = $state<string | null>(null)

    const handleArchive = (expense: FixedExpense) => {
        if (!role.canManage) return
        archiveError = null
        toArchive = expense
    }
    const confirmArchive = () => {
        if (!toArchive) return
        $archive.mutate(toArchive.id, {
            onSuccess: () => (toArchive = null),
            onError: (error: unknown) => {
                archiveError = getErrorMessage(error) ?? 'No se pudo archivar. Inténtalo de nuevo.'
            }
        })
    }
</script>

<div class="flex flex-col gap-4">
    {#if $query.isLoading}
        <SkeletonList rows={3} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudieron cargar" message={getErrorMessage($query.error)} />
    {:else if expenses.length === 0}
        <FixedExpensesEmpty canManage={role.canManage} onCreate={openCreate} />
    {:else}
        <FixedExpensesSummary summary={summary.value} />

        {#if role.canManage}
            <button
                type="button"
                onclick={openCreate}
                class="surface flex h-[52px] w-full items-center justify-center gap-2 text-[15px] font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.98]"
            >
                <Plus size={18} strokeWidth={2.4} />
                Nuevo gasto fijo
            </button>
        {/if}

        <div class="flex flex-col gap-3">
            {#each expenses as expense (expense.id)}
                <FixedExpenseCard
                    {expense}
                    now={tick.now}
                    canManage={role.canManage}
                    onEdit={openEdit}
                    onArchive={handleArchive}
                    archiving={$archive.isPending}
                />
            {/each}
        </div>
    {/if}
</div>

<ConfirmSheet
    open={toArchive !== null}
    title="Archivar gasto fijo"
    message={toArchive ? `Al archivar "${toArchive.name}" se detiene su acumulación. Podrás verlo en el historial.` : ''}
    confirmLabel="Archivar"
    destructive
    loading={$archive.isPending}
    error={archiveError}
    onConfirm={confirmArchive}
    onClose={() => (toArchive = null)}
/>

{#if formOpen}
    {#key editing?.id ?? 'new'}
        <FixedExpenseFormModal expense={editing} onClose={() => (formOpen = false)} />
    {/key}
{/if}
