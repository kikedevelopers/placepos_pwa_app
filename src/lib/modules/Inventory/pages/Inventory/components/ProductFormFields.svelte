<script lang="ts">
    import { Plus } from '@lucide/svelte'
    import FormField from '$lib/components/FormField.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import type { ProductFormData } from '../schemas/product.schema'
    import CategoryField from './CategoryField.svelte'
    import PackagingField from './PackagingField.svelte'
    import PriceRow from './PriceRow.svelte'
    import SwitchRow from './SwitchRow.svelte'

    interface Props {
        form: ProductFormData
        errors: Record<string, string>
        addPrice: () => void
        removePrice: (index: number) => void
        canAddPrice: boolean
        canRemovePrice: boolean
    }
    let { form, errors, addPrice, removePrice, canAddPrice, canRemovePrice }: Props = $props()

    const pricesError = $derived(errors['prices'])
</script>

<div class="flex flex-col gap-4">
    <FormField
        bind:value={form.name}
        label="Nombre del producto"
        placeholder="Nombre del producto"
        error={errors['name']}
        maxlength={150}
    />

    <div class="flex gap-3">
        <div class="flex-1">
            <FormField
                bind:value={form.sku_code}
                label="SKU"
                placeholder="Código SKU"
                error={errors['sku_code']}
                autocapitalize="characters"
                maxlength={50}
            />
        </div>
        <div class="flex-1">
            <FormField
                bind:value={form.bar_code}
                label="Código de barras"
                placeholder="Código"
                error={errors['bar_code']}
                autocapitalize="characters"
                maxlength={50}
            />
        </div>
    </div>

    <FormField
        bind:value={form.description}
        label="Descripción"
        placeholder="Descripción del producto"
        error={errors['description']}
        maxlength={500}
        multiline
    />

    <CategoryField value={form.category_id} onSelect={(id) => (form.category_id = id)} />
    <PackagingField value={form.packaging_id} onSelect={(id) => (form.packaging_id = id)} />

    <div class="flex gap-3">
        <div class="flex-1">
            <FormField
                bind:value={form.stock}
                label="Stock disponible"
                placeholder="0"
                error={errors['stock']}
                inputmode="decimal"
            />
        </div>
        <div class="flex-1">
            <MoneyInput
                label="Costo unitario"
                value={form.cost}
                onValueChange={(v) => (form.cost = v ?? 0)}
                prefix="$ "
                error={errors['cost']}
            />
        </div>
    </div>

    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
            <span class="ml-0.5 text-[13px] font-semibold text-foreground/70">Precios de venta</span>
            {#if canAddPrice}
                <button
                    type="button"
                    onclick={addPrice}
                    class="flex items-center gap-1 rounded-full px-3 py-1.5 transition-opacity active:opacity-80"
                    style="background-color: hsla(217, 91%, 50%, 0.12)"
                >
                    <Plus size={14} color="hsl(217, 91%, 50%)" strokeWidth={2.5} />
                    <span class="text-xs font-semibold text-primary">Agregar</span>
                </button>
            {/if}
        </div>
        {#if pricesError}
            <p class="ml-0.5 text-xs text-destructive">{pricesError}</p>
        {/if}
        {#each form.prices as price, index (index)}
            <PriceRow
                {price}
                {index}
                cost={form.cost}
                canRemove={canRemovePrice}
                onRemove={() => removePrice(index)}
                error={errors[`prices.${index}.sale_price`]}
            />
        {/each}
    </div>

    <SwitchRow
        label="Disponible para venta"
        description="Visible en el punto de venta"
        value={form.show_in_pos}
        onValueChange={(v) => (form.show_in_pos = v)}
    />
    <SwitchRow
        label="Disponible para compra"
        description="Se puede comprar a proveedores"
        value={form.is_purchasable}
        onValueChange={(v) => {
            form.is_purchasable = v
            if (v) form.show_in_pos = false
        }}
    />
</div>
