<script lang="ts">
    import { Package, Plus, Scale } from '@lucide/svelte'
    import FormField from '$lib/components/FormField.svelte'
    import NumberField from '$lib/components/NumberField.svelte'
    import AutocompleteField from '$lib/components/AutocompleteField.svelte'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { PresentationFormData, PricingMode } from '../schemas/presentation.schema'
    import PackagingField from './PackagingField.svelte'
    import PriceRow from './PriceRow.svelte'
    import PriceInputModeToggle, { type PriceInputMode } from './PriceInputModeToggle.svelte'
    import SwitchRow from './SwitchRow.svelte'

    interface Props {
        form: PresentationFormData
        errors: Record<string, string>
        parentOptions: { id: number; label: string }[]
        hasParent: boolean
        effectiveValue: number
        calculatedCost: number
        virtualStock: number
        merma: number
        setParent: (id: number | null) => void
        setMode: (mode: PricingMode) => void
        addPrice: () => void
        removePrice: (index: number) => void
        canAddPrice: boolean
        canRemovePrice: boolean
    }
    let {
        form,
        errors,
        parentOptions,
        hasParent,
        effectiveValue,
        calculatedCost,
        virtualStock,
        merma,
        setParent,
        setMode,
        addPrice,
        removePrice,
        canAddPrice,
        canRemovePrice
    }: Props = $props()

    // Cómo se definen TODOS los precios. Estado de UI: no se persiste ni viaja al
    // backend — lo guardado (sale_price/profit/margin) es idéntico en ambos modos.
    // Cambiar de modo NO recalcula nada, solo cambia qué campo se escribe.
    let pricingMode = $state<PriceInputMode>('price')

    const isPackaging = $derived(form.pricing_mode === 'packaging')
    const isFromPrice = $derived(form.pricing_mode === 'from_price')
    const pricesError = $derived(errors['prices'])
</script>

<div class="flex flex-col gap-4">
    <!-- Producto base (padre) -->
    <div>
        <AutocompleteField
            label="Producto base"
            placeholder="Buscar producto base"
            value={form.parent_id || null}
            options={parentOptions}
            onSelect={setParent}
        />
        {#if errors['parent_id']}
            <p class="ml-0.5 mt-1 text-xs text-destructive">{errors['parent_id']}</p>
        {:else}
            <p class="ml-0.5 mt-1 text-[11px] text-muted-foreground">
                Solo productos base con empaque pueden tener presentaciones.
            </p>
        {/if}
    </div>

    <!-- Medida de la presentación -->
    <div class="flex flex-col gap-2">
        <span class="ml-0.5 text-[13px] font-semibold text-foreground/70"
            >Medida de la presentación</span
        >
        <div class="flex gap-3">
            <button
                type="button"
                onclick={() => setMode('packaging')}
                class="flex flex-1 flex-col items-start gap-1 rounded-2xl border-[1.5px] px-3.5 py-3 text-left"
                style="border-color:{isPackaging
                    ? 'hsl(217, 91%, 50%)'
                    : 'hsla(214, 32%, 89%, 0.9)'};background-color:{isPackaging
                    ? 'hsla(217, 91%, 50%, 0.06)'
                    : 'transparent'}"
            >
                <Package size={18} color={isPackaging ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 55%)'} />
                <span class="text-sm font-semibold text-foreground">Empaque fijo</span>
                <span class="text-[11px] text-muted-foreground">Factor fijo por unidad</span>
            </button>
            <button
                type="button"
                onclick={() => setMode('quantity')}
                class="flex flex-1 flex-col items-start gap-1 rounded-2xl border-[1.5px] px-3.5 py-3 text-left"
                style="border-color:{!isPackaging
                    ? 'hsl(217, 91%, 50%)'
                    : 'hsla(214, 32%, 89%, 0.9)'};background-color:{!isPackaging
                    ? 'hsla(217, 91%, 50%, 0.06)'
                    : 'transparent'}"
            >
                <Scale size={18} color={!isPackaging ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 55%)'} />
                <span class="text-sm font-semibold text-foreground">Peso variable</span>
                <span class="text-[11px] text-muted-foreground">Peso o monto por unidad</span>
            </button>
        </div>

        {#if isPackaging}
            <PackagingField value={form.packaging_id} onSelect={(id) => (form.packaging_id = id)} />
            {#if errors['packaging_id']}
                <p class="ml-0.5 text-xs text-destructive">{errors['packaging_id']}</p>
            {/if}
        {:else}
            <!-- Submodo peso variable: ingresar peso | desde el precio -->
            <div class="flex gap-2">
                <button
                    type="button"
                    onclick={() => setMode('quantity')}
                    class="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold {!isFromPrice
                        ? 'border-primary/40 bg-primary/[0.06] text-primary'
                        : 'border-border text-muted-foreground'}"
                >
                    Ingresar peso
                </button>
                <button
                    type="button"
                    onclick={() => setMode('from_price')}
                    class="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold {isFromPrice
                        ? 'border-primary/40 bg-primary/[0.06] text-primary'
                        : 'border-border text-muted-foreground'}"
                >
                    Desde el precio
                </button>
            </div>

            {#if isFromPrice}
                <div class="rounded-xl border border-border bg-secondary/40 px-3.5 py-3">
                    <p class="text-[11px] text-muted-foreground">
                        Cantidad calculada desde el precio más alto
                    </p>
                    <p class="mt-0.5 text-base font-bold text-foreground">
                        {formatNumber(effectiveValue)}
                    </p>
                </div>
            {:else}
                <NumberField
                    label="Cantidad por unidad (unidad base)"
                    value={form.packaging_value || null}
                    onValueChange={(v) => (form.packaging_value = v ?? 0)}
                    error={errors['packaging_value']}
                    min={0}
                />
            {/if}
        {/if}
    </div>

    <!-- Info derivada del padre -->
    {#if hasParent && effectiveValue > 0}
        <div class="flex gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <div class="flex-1">
                <p class="text-[11px] text-muted-foreground">Costo (calculado)</p>
                <p class="mt-0.5 text-sm font-bold text-foreground">
                    {formatCurrency(calculatedCost)}
                </p>
            </div>
            <div class="flex-1">
                <p class="text-[11px] text-muted-foreground">Stock informativo</p>
                <p class="mt-0.5 text-sm font-bold text-foreground">
                    {formatNumber(virtualStock)} u
                    {#if merma > 0}
                        <span class="text-[11px] font-normal text-muted-foreground"
                            >· merma {formatNumber(merma)}</span
                        >
                    {/if}
                </p>
            </div>
        </div>
    {/if}

    <!-- Información general -->
    <FormField
        bind:value={form.name}
        label="Nombre de la presentación"
        placeholder="Nombre de la presentación"
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
        placeholder="Descripción de la presentación"
        error={errors['description']}
        maxlength={500}
        multiline
    />

    <SwitchRow
        label="Disponible para venta"
        description="Visible en el punto de venta"
        value={form.show_in_pos}
        onValueChange={(v) => (form.show_in_pos = v)}
    />

    <!-- Precios de venta (ganancia/margen contra el costo calculado) -->
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
            <span class="ml-0.5 text-[13px] font-semibold text-foreground/70">Precios de venta</span>
            <PriceInputModeToggle mode={pricingMode} onChange={(m) => (pricingMode = m)} />
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
                mode={pricingMode}
                {price}
                {index}
                cost={calculatedCost}
                canRemove={canRemovePrice}
                onRemove={() => removePrice(index)}
                error={errors[`prices.${index}.sale_price`]}
            />
        {/each}
    </div>
</div>
