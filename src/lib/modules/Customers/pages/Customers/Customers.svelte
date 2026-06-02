<script lang="ts">
    import { Plus, UserPlus, Users } from '@lucide/svelte'
    import type { Customer } from '$lib/api/requests/customers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import StatTile from '$lib/components/StatTile.svelte'
    import { useCustomerAnalytics, useCustomers } from './hooks/useCustomers'
    import CustomerCard from './components/CustomerCard.svelte'
    import CustomerFormModal from './components/CustomerFormModal.svelte'

    const role = useUserRole()
    let search = $state('')
    const debounced = useDebouncedValue(() => search, 250)

    const query = useCustomers()
    const analytics = useCustomerAnalytics()

    let formOpen = $state(false)
    let editing = $state<Customer | null>(null)

    const data = $derived($query.data)
    const filtered = $derived.by(() => {
        const list = data ?? []
        const q = debounced.value.trim().toLowerCase()
        if (!q) return list
        return list.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.email ?? '').toLowerCase().includes(q) ||
                (c.doc_number ?? '').toLowerCase().includes(q)
        )
    })

    const openCreate = () => {
        editing = null
        formOpen = true
    }
    const openEdit = (customer: Customer) => {
        if (!role.canManage) return
        editing = customer
        formOpen = true
    }
</script>

<div class="flex flex-1 flex-col gap-3 px-5 pb-8 pt-4">
    <div class="flex flex-col gap-4 pb-3">
        <div class="flex gap-3">
            <div class="flex-1">
                <SearchField
                    bind:value={search}
                    placeholder="Buscar por nombre, correo o documento"
                />
            </div>
            {#if role.canManage}
                <button
                    type="button"
                    onclick={openCreate}
                    aria-label="Nuevo cliente"
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary transition-transform active:scale-[0.97]"
                >
                    <Plus size={22} color="white" strokeWidth={2.5} />
                </button>
            {/if}
        </div>

        {#if $analytics.data}
            <div class="flex gap-3">
                <StatTile
                    icon={Users}
                    label="Total clientes"
                    value={String($analytics.data.customers_count)}
                    bg="hsla(217, 91%, 50%, 0.12)"
                    fg="hsl(217, 91%, 50%)"
                />
                <StatTile
                    icon={UserPlus}
                    label="Nuevos este mes"
                    value={String($analytics.data.new_customers)}
                    bg="hsla(158, 64%, 38%, 0.12)"
                    fg="hsl(158, 64%, 38%)"
                />
            </div>
        {/if}

        {#if $query.isLoading}
            <ScreenState kind="loading" />
        {:else if $query.isError}
            <ScreenState kind="error" message={getErrorMessage($query.error)} />
        {:else if data && filtered.length === 0}
            <ScreenState
                kind="empty"
                message={search
                    ? 'Sin resultados para tu búsqueda.'
                    : 'Aún no hay clientes. Crea el primero.'}
            />
        {/if}
    </div>

    {#each filtered as customer (customer.id)}
        <CustomerCard {customer} onclick={() => openEdit(customer)} />
    {/each}
</div>

{#if formOpen}
    {#key editing?.id ?? 'new'}
        <CustomerFormModal customer={editing} onClose={() => (formOpen = false)} />
    {/key}
{/if}
