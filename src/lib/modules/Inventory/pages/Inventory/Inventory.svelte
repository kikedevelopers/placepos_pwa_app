<script lang="ts">
    import { Boxes, Plus } from '@lucide/svelte'
    import type { Product } from '$lib/api/requests/products'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCompactCurrency } from '$lib/utils/numbers'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import { EmptyState, Metrics, Segmented, SkeletonList } from '$lib/components/premium'
    import VirtualList from '$lib/components/VirtualList.svelte'
    import { useProducts } from './hooks/useProducts'
    import { computeInventoryStats } from './utils/inventoryStats'
    import ProductRow from './components/ProductRow.svelte'
    import { INVENTORY_FILTERS, filterInventory, type InventoryFilter } from './utils/inventoryList'
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
    let filter = $state<InventoryFilter>('all')
    const filtered = $derived(filterInventory(data ?? [], debounced.value, filter))
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

<!--
    Vista de scroll PROPIO (lista virtualizada): `.dock-bleed` hace que llegue
    hasta el borde inferior y la lista reserva el alto del dock dentro de su
    scroll (tailSpace). Arriba, búsqueda + cifras + filtros quedan fijos.
-->
<div class="dock-bleed flex min-h-0 flex-1 flex-col">
    <div class="flex shrink-0 flex-col gap-3 px-5 pb-3 pt-5">
        <div class="flex items-center gap-2.5">
            <div class="min-w-0 flex-1">
                <SearchField bind:value={search} placeholder="Nombre, SKU o código de barras" />
            </div>
            {#if role.canManage}
                <button
                    type="button"
                    onclick={() => (menuOpen = true)}
                    aria-label="Crear producto o presentación"
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_hsl(var(--primary)/0.7)] transition-transform duration-150 ease-out active:scale-[0.92]"
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
            {/if}
        </div>

        {#if data}
            <Metrics
                ariaLabel="Resumen del inventario"
                columns={3}
                items={[
                    { label: 'Productos', text: stats.count.toLocaleString('es-CO') },
                    { label: 'Valorización', text: formatCompactCurrency(stats.valuation) },
                    { label: 'Agotados', text: stats.outOfStock.toLocaleString('es-CO'), tone: stats.outOfStock > 0 ? 'negative' : 'neutral' }
                ]}
            />
            <Segmented ariaLabel="Filtrar inventario" options={INVENTORY_FILTERS} value={filter} onChange={(v) => (filter = v)} />
        {/if}
    </div>

    {#if $query.isLoading}
        <div class="px-5"><SkeletonList rows={7} /></div>
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudo cargar el inventario" message={getErrorMessage($query.error)} />
    {:else if data && filtered.length === 0}
        <EmptyState
            icon={Boxes}
            title={debounced.value ? 'Sin resultados' : filter === 'out' ? 'Nada agotado' : 'Sin productos'}
            message={debounced.value
                ? 'Prueba con otro nombre, SKU o código.'
                : filter === 'out'
                  ? 'Todos los productos tienen existencias.'
                  : 'Crea el primero con el botón +.'}
        />
    {:else if data}
        <p class="shrink-0 px-6 pb-2 text-[12.5px] text-muted-foreground">
            {filtered.length.toLocaleString('es-CO')} {filtered.length === 1 ? 'resultado' : 'resultados'}
        </p>
        <VirtualList
            items={filtered}
            getKey={(product) => product.id}
            estimateHeight={72}
            resetKey={`${debounced.value}|${filter}`}
            tailSpace="calc(var(--dock-space) + 8px)"
            class="min-h-0 flex-1 px-5"
        >
            {#snippet children(product, index)}
                <ProductRow
                    {product}
                    first={index === 0}
                    last={index === filtered.length - 1}
                    onclick={role.canManage ? () => openEdit(product) : undefined}
                />
            {/snippet}
        </VirtualList>
    {/if}
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
