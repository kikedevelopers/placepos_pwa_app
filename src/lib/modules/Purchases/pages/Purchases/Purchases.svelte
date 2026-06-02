<script lang="ts">
    import { CalendarDays, ShoppingBag, Wallet } from '@lucide/svelte'
    import type { Purchase } from '$lib/api/requests'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCompactCurrency } from '$lib/utils/numbers'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import StatTile from '$lib/components/StatTile.svelte'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import { usePurchases } from './hooks/usePurchases'
    import PurchaseCard from './components/PurchaseCard.svelte'

    type ScopeFilter = 'pending' | 'all'
    type DateFilter = 'all' | 'today' | '7d' | 'month'

    const SCOPE_OPTIONS: readonly { id: ScopeFilter; label: string }[] = [
        { id: 'pending', label: 'Con saldo' },
        { id: 'all', label: 'Todas' }
    ]
    const DATE_OPTIONS: readonly { id: DateFilter; label: string }[] = [
        { id: 'all', label: 'Todo' },
        { id: 'today', label: 'Hoy' },
        { id: '7d', label: '7 días' },
        { id: 'month', label: 'Este mes' }
    ]

    const cutoffFor = (preset: DateFilter): number => {
        const d = new Date()
        if (preset === 'today') {
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        }
        if (preset === '7d') {
            d.setDate(d.getDate() - 7)
            return d.getTime()
        }
        if (preset === 'month') {
            d.setDate(1)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        }
        return 0
    }

    let scope = $state<ScopeFilter>('pending')
    let datePreset = $state<DateFilter>('all')
    let search = $state('')
    const debounced = useDebouncedValue(() => search, 250)

    const query = usePurchases(() => scope === 'all')

    const data = $derived($query.data)
    const filtered = $derived.by(() => {
        const list = data ?? []
        const cutoff = cutoffFor(datePreset)
        const q = debounced.value.trim().toLowerCase()
        return list.filter((p) => {
            if (new Date(p.created_at).getTime() < cutoff) return false
            if (!q) return true
            return (
                p.supplier_name.toLowerCase().includes(q) ||
                p.purchase_number.toLowerCase().includes(q) ||
                (p.created_by ?? '').toLowerCase().includes(q)
            )
        })
    })

    const stats = $derived.by(() => {
        const total = filtered.reduce((acc, p) => acc + p.total, 0)
        const balance = filtered.reduce((acc, p) => acc + (p.credit?.balance ?? 0), 0)
        return { count: filtered.length, total, balance }
    })
</script>

<div class="flex flex-1 flex-col gap-3 px-5 pb-8 pt-4">
    <div class="flex flex-col gap-4 pb-3">
        <div class="flex flex-col gap-3">
            <FilterChips
                options={SCOPE_OPTIONS}
                value={scope}
                onChange={(v) => (scope = v as ScopeFilter)}
            />
            <FilterChips
                options={DATE_OPTIONS}
                value={datePreset}
                onChange={(v) => (datePreset = v as DateFilter)}
            />
            <SearchField bind:value={search} placeholder="Buscar por proveedor o nº de compra" />
        </div>

        {#if data}
            <div class="flex gap-3">
                <StatTile
                    icon={ShoppingBag}
                    label="Compras"
                    value={String(stats.count)}
                    bg="hsla(158, 64%, 38%, 0.12)"
                    fg="hsl(158, 64%, 38%)"
                />
                <StatTile
                    icon={CalendarDays}
                    label="Total comprado"
                    value={formatCompactCurrency(stats.total)}
                    bg="hsla(217, 91%, 50%, 0.12)"
                    fg="hsl(217, 91%, 50%)"
                />
                <StatTile
                    icon={Wallet}
                    label="Saldo"
                    value={formatCompactCurrency(stats.balance)}
                    bg="hsla(32, 95%, 44%, 0.14)"
                    fg="hsl(32, 95%, 44%)"
                />
            </div>
        {/if}

        {#if $query.isLoading}
            <ScreenState kind="loading" />
        {:else if $query.isError}
            <ScreenState kind="error" message={getErrorMessage($query.error)} />
        {:else if data && filtered.length === 0}
            <ScreenState kind="empty" message="No hay compras para los filtros aplicados." />
        {/if}
    </div>

    {#each filtered as purchase (purchase.id)}
        <PurchaseCard {purchase} />
    {/each}
</div>
