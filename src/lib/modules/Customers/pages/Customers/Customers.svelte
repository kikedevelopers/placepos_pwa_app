<script lang="ts">
    import { Plus, Users } from '@lucide/svelte'
    import type { Customer } from '$lib/api/requests/customers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import SelectField from '$lib/components/SelectField.svelte'
    import { EmptyState, Metrics, ProgressiveList, SkeletonList } from '$lib/components/premium'
    import { useCustomerCategories } from '$lib/modules/CustomerCategories/hooks/useCustomerCategories'
    import { useCustomerAnalytics, useCustomers } from './hooks/useCustomers'
    import { filterCustomers } from './utils/filterCustomers'
    import CustomerRow from './components/CustomerRow.svelte'
    import { groupByInitial } from './utils/groupCustomers'
    import CustomerFormModal from './components/CustomerFormModal.svelte'

    const role = useUserRole()
    let search = $state('')
    const debounced = useDebouncedValue(() => search, 250)

    const query = useCustomers()
    const analytics = useCustomerAnalytics()
    const categoriesQuery = useCustomerCategories()

    let formOpen = $state(false)
    let editing = $state<Customer | null>(null)
    // Filtro por categoría ESPECIAL. `null` = todas.
    let categoryFilter = $state<number | null>(null)

    const data = $derived($query.data)
    const categories = $derived($categoriesQuery.data ?? [])
    const categoryOptions = $derived([
        { value: '', label: 'Todas las categorías' },
        ...categories.map((c) => ({ value: String(c.id), label: c.name }))
    ])
    const filtered = $derived(filterCustomers(data ?? [], debounced.value, categoryFilter))
    const groups = $derived(groupByInitial(filtered, (c) => c.name))

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

<div class="flex flex-col gap-4 px-5 pb-6 pt-5">
    <div class="flex items-center gap-2.5">
        <div class="min-w-0 flex-1">
            <SearchField bind:value={search} placeholder="Nombre, correo o documento" />
        </div>
        {#if role.canManage}
            <button
                type="button"
                onclick={openCreate}
                aria-label="Nuevo cliente"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_hsl(var(--primary)/0.7)] transition-transform duration-150 ease-out active:scale-[0.92]"
            >
                <Plus size={20} strokeWidth={2.5} />
            </button>
        {/if}
    </div>

    {#if $analytics.data}
        <Metrics
            ariaLabel="Resumen de clientes"
            items={[
                { label: 'Clientes', text: $analytics.data.customers_count.toLocaleString('es-CO') },
                { label: 'Nuevos este mes', text: $analytics.data.new_customers.toLocaleString('es-CO'), tone: $analytics.data.new_customers > 0 ? 'positive' : 'neutral' }
            ]}
        />
    {/if}

    {#if categories.length > 0}
        <!-- Filtro por categoría especial del cliente. -->
        <SelectField
            value={categoryFilter === null ? '' : String(categoryFilter)}
            options={categoryOptions}
            onChange={(v) => (categoryFilter = v ? Number(v) : null)}
            placeholder="Todas las categorías"
            sheetTitle="Filtrar por categoría"
        />
    {/if}

    {#if $query.isLoading}
        <SkeletonList rows={8} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudieron cargar los clientes" message={getErrorMessage($query.error)} />
    {:else if data && filtered.length === 0}
        <EmptyState
            icon={Users}
            title={search ? 'Sin resultados' : 'Aún no hay clientes'}
            message={search ? 'Prueba con otro nombre, correo o documento.' : 'Crea el primero con el botón +.'}
        />
    {:else if data}
        <ProgressiveList items={groups} step={6} resetKey={`${debounced.value}|${categoryFilter}`}>
            {#snippet children(shown)}
                <div class="flex flex-col gap-4">
                    {#each shown as group (group.letter)}
                        <section aria-label={`Clientes con ${group.letter}`}>
                            <h3 class="mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">{group.letter}</h3>
                            <div class="surface group-rows overflow-hidden">
                                {#each group.items as customer (customer.id)}
                                    <CustomerRow {customer} onclick={role.canManage ? () => openEdit(customer) : undefined} />
                                {/each}
                            </div>
                        </section>
                    {/each}
                </div>
            {/snippet}
        </ProgressiveList>
    {/if}
</div>

{#if formOpen}
    {#key editing?.id ?? 'new'}
        <CustomerFormModal customer={editing} onClose={() => (formOpen = false)} />
    {/key}
{/if}
