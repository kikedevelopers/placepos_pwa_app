<script lang="ts">
    import { AlertTriangle, Boxes, Plus, Wallet } from '@lucide/svelte'
    import type { Product } from '$lib/api/requests/products'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCompactCurrency } from '$lib/utils/numbers'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import StatTile from '$lib/components/StatTile.svelte'
    import { useProducts } from './hooks/useProducts'
    import ProductCard from './components/ProductCard.svelte'
    import ProductFormModal from './components/ProductFormModal.svelte'

    const role = useUserRole()
    let search = $state('')
    const debounced = useDebouncedValue(() => search, 250)

    const query = useProducts()

    let formOpen = $state(false)
    let editing = $state<Product | null>(null)

    const data = $derived($query.data)
    const filtered = $derived.by(() => {
        const list = data ?? []
        const q = debounced.value.trim().toLowerCase()
        if (!q) return list
        return list.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.sku_code ?? '').toLowerCase().includes(q) ||
                (p.bar_code ?? '').toLowerCase().includes(q)
        )
    })
    const stats = $derived.by(() => {
        const list = data ?? []
        const valuation = list.reduce((acc, p) => acc + p.cost * p.stock, 0)
        const outOfStock = list.filter((p) => p.stock_display <= 0).length
        return { count: list.length, valuation, outOfStock }
    })

    const openCreate = () => {
        editing = null
        formOpen = true
    }
    const openEdit = (product: Product) => {
        if (!role.canManage) return
        editing = product
        formOpen = true
    }
</script>

<div class="flex flex-1 flex-col gap-3 px-5 pb-8 pt-4">
    <div class="flex flex-col gap-4 pb-3">
        <div class="flex gap-3">
            <div class="flex-1">
                <SearchField
                    bind:value={search}
                    placeholder="Buscar por nombre, SKU o código de barras"
                />
            </div>
            {#if role.canManage}
                <button
                    type="button"
                    onclick={openCreate}
                    aria-label="Nuevo producto"
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary transition-transform active:scale-[0.97]"
                >
                    <Plus size={22} color="white" strokeWidth={2.5} />
                </button>
            {/if}
        </div>

        {#if data}
            <div class="flex gap-3">
                <StatTile
                    icon={Boxes}
                    label="Productos"
                    value={String(stats.count)}
                    bg="hsla(217, 91%, 50%, 0.12)"
                    fg="hsl(217, 91%, 50%)"
                />
                <StatTile
                    icon={Wallet}
                    label="Valorización"
                    value={formatCompactCurrency(stats.valuation)}
                    bg="hsla(158, 64%, 38%, 0.12)"
                    fg="hsl(158, 64%, 38%)"
                />
                <StatTile
                    icon={AlertTriangle}
                    label="Sin existencias"
                    value={String(stats.outOfStock)}
                    bg="hsla(0, 84%, 55%, 0.12)"
                    fg="hsl(0, 84%, 55%)"
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
                    : 'Aún no hay productos. Crea el primero.'}
            />
        {/if}
    </div>

    {#each filtered as product (product.id)}
        <ProductCard {product} onclick={() => openEdit(product)} />
    {/each}
</div>

{#if formOpen}
    {#key editing?.id ?? 'new'}
        <ProductFormModal product={editing} onClose={() => (formOpen = false)} />
    {/key}
{/if}
