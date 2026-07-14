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
    import { computeInventoryStats } from './utils/inventoryStats'
    import ProductCard from './components/ProductCard.svelte'
    import ProductFormModal from './components/ProductFormModal.svelte'
    import PresentationFormModal from './components/PresentationFormModal.svelte'
    import CreateMenuSheet from './components/CreateMenuSheet.svelte'

    const role = useUserRole()
    let search = $state('')
    const debounced = useDebouncedValue(() => search, 250)

    const query = useProducts()

    // Menú del botón "+" (Crear producto | Crear presentación).
    let menuOpen = $state(false)
    // Form de producto BASE.
    let productFormOpen = $state(false)
    let editingProduct = $state<Product | null>(null)
    // Form de PRESENTACIÓN (producto hijo).
    let presentationFormOpen = $state(false)
    let editingPresentation = $state<Product | null>(null)

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
    const stats = $derived.by(() => computeInventoryStats(data ?? []))

    const createProduct = () => {
        menuOpen = false
        editingProduct = null
        productFormOpen = true
    }
    const createPresentation = () => {
        menuOpen = false
        editingPresentation = null
        presentationFormOpen = true
    }
    // Editar desde la tarjeta: una presentación (parent_id) abre SU formulario;
    // un producto base abre el de producto. Espejo de placepos (openVariantEdit
    // vs openEdit según p.parent_id).
    const openEdit = (product: Product) => {
        if (!role.canManage) return
        if (product.parent_id) {
            editingPresentation = product
            presentationFormOpen = true
        } else {
            editingProduct = product
            productFormOpen = true
        }
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
                    onclick={() => (menuOpen = true)}
                    aria-label="Crear"
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

<CreateMenuSheet
    open={menuOpen}
    onClose={() => (menuOpen = false)}
    onCreateProduct={createProduct}
    onCreatePresentation={createPresentation}
/>

{#if productFormOpen}
    {#key editingProduct?.id ?? 'new'}
        <ProductFormModal
            product={editingProduct}
            onClose={() => (productFormOpen = false)}
        />
    {/key}
{/if}

{#if presentationFormOpen}
    {#key editingPresentation?.id ?? 'new'}
        <PresentationFormModal
            presentation={editingPresentation}
            onClose={() => (presentationFormOpen = false)}
        />
    {/key}
{/if}
