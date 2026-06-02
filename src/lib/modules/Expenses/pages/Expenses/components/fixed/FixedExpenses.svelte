<script lang="ts">
    import { Plus } from '@lucide/svelte'
    import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
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

    const handleArchive = (expense: FixedExpense) => {
        if (!role.canManage) return
        const ok =
            typeof window !== 'undefined' &&
            window.confirm(
                `Al archivar "${expense.name}" se detiene su acumulación. Podrás verlo en el historial. ¿Continuar?`
            )
        if (!ok) return
        $archive.mutate(expense.id)
    }
</script>

<div class="flex flex-1 flex-col gap-4">
    {#if $query.isLoading}
        <ScreenState kind="loading" />
    {:else if $query.isError}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    {:else if expenses.length === 0}
        <FixedExpensesEmpty canManage={role.canManage} onCreate={openCreate} />
    {:else}
        <FixedExpensesSummary summary={summary.value} />

        {#if role.canManage}
            <button
                type="button"
                onclick={openCreate}
                class="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                style="background:linear-gradient(135deg, hsl(258,90%,62%), hsl(340,82%,60%));box-shadow:0 10px 20px hsla(258,90%,55%,0.28)"
            >
                <Plus size={18} color="white" strokeWidth={2.4} />
                Nuevo gasto fijo
            </button>
        {/if}

        <div class="flex flex-col gap-4">
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

{#if formOpen}
    {#key editing?.id ?? 'new'}
        <FixedExpenseFormModal expense={editing} onClose={() => (formOpen = false)} />
    {/key}
{/if}
