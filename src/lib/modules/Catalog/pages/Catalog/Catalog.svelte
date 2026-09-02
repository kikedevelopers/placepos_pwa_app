<script lang="ts">
    import type { PosProduct } from '$lib/api/requests/pos'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import { useCatalogItems } from './hooks/useCatalogItems'
    import { filterCatalogItems } from './utils/filterCatalogItems'
    import CatalogCard from './components/CatalogCard.svelte'
    import ProductDetailModal from './components/ProductDetailModal.svelte'

    let search = $state('')
    const debounced = useDebouncedValue(() => search, 250)

    const query = useCatalogItems()
    const data = $derived($query.data)
    const filtered = $derived.by(() => filterCatalogItems(data ?? [], debounced.value))

    let selected = $state<PosProduct | null>(null)
</script>

<div class="flex flex-1 flex-col gap-4 px-5 pb-8 pt-4">
    <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Catálogo</h1>
        {#if data && data.length > 0}
            <p class="text-xs text-muted-foreground">
                {debounced.value
                    ? `${filtered.length} de ${data.length} productos`
                    : `${data.length} producto${data.length === 1 ? '' : 's'} para mostrar`}
            </p>
        {:else}
            <p class="text-xs text-muted-foreground">Los productos de tu negocio, listos para presumir.</p>
        {/if}
    </div>

    <SearchField bind:value={search} placeholder="Buscar por nombre, SKU o código de barras" />

    {#if $query.isLoading}
        <ScreenState kind="loading" />
    {:else if $query.isError}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    {:else if data && filtered.length === 0}
        <ScreenState
            kind="empty"
            message={search
                ? 'Sin resultados para tu búsqueda.'
                : 'Aún no hay productos visibles en el catálogo.'}
        />
    {:else if data}
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {#each filtered as product, i (product.id)}
                <!-- Stagger acotado a los primeros ítems: un catálogo de 100+
                     productos no puede tardar segundos en terminar de aparecer. -->
                <FadeInUp index={Math.min(i, 11)} delayStep={35} duration={300}>
                    <CatalogCard {product} onclick={() => (selected = product)} />
                </FadeInUp>
            {/each}
        </div>
    {/if}
</div>

<ProductDetailModal product={selected} onClose={() => (selected = null)} />
