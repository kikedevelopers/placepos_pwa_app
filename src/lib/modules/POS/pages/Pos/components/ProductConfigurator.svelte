<script lang="ts" module>
    import type { PosProduct } from '$lib/api/requests/pos'

    export type ConfiguratorInitial = {
        price: number
        quantity: number
        price_mode: 'fixed' | 'manual'
        price_position: number | null
        note: string | null
    }

    export type ProductConfiguratorProps = {
        visible: boolean
        product: PosProduct | null
        initial: ConfiguratorInitial | null
        onClose: () => void
        onConfirm: (item: NewCartItem) => void
    }
</script>

<script lang="ts">
    import Minus from '@lucide/svelte/icons/minus'
    import Plus from '@lucide/svelte/icons/plus'
    import Scale from '@lucide/svelte/icons/scale'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import { formatCurrency, formatNumber, parseDecimal } from '$lib/utils/numbers'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import {
        buildConfiguredLine,
        calculateMarginFromPrices,
        lineProfit,
        lineTotal,
        quantityFromAmount,
        roundToDecimals
    } from '$lib/modules/POS/utils/posLineMath'
    import type { NewCartItem } from '$lib/modules/POS/store/posCart.svelte'

    let { visible, product, initial, onClose, onConfirm }: ProductConfiguratorProps = $props()

    // Subpermisos del configurador (espejo de placepos desktop): Ganancia ($) y
    // Margen (%) se gatean por separado. owner siempre; empleado según cada flag.
    const permissions = usePermissions()
    const canViewProductMargin = $derived(permissions.canViewProductMargin)
    const canViewProductProfit = $derived(permissions.canViewProductProfit)
    const canViewAnyProfitMetric = $derived(canViewProductMargin || canViewProductProfit)

    // --- Estado del cuerpo. Se reinicia cuando cambia el producto (equivalente
    // al remonte por `key={product.id}` de placepos). ---
    let selectedPriceIndex = $state<number | null>(0)
    let manualPrice = $state<number | null>(null)
    let isManualPriceMode = $state(false)
    let isAutoCalcMode = $state(false)
    // `priceValue` es el precio unitario efectivo (equivale a `form.price` de
    // placepos): lo actualizan los handlers imperativamente.
    let priceValue = $state(0)
    let qty = $state('1')
    let note = $state('')

    let lastProductId = $state<number | null>(null)
    $effect(() => {
        if (!product || product.id === lastProductId) return
        lastProductId = product.id
        const hasPricesNow = product.prices.length > 0
        isAutoCalcMode = false
        note = initial?.note ?? ''

        if (initial) {
            qty = String(initial.quantity)
            priceValue = initial.price
            if (initial.price_mode === 'manual') {
                isManualPriceMode = true
                manualPrice = initial.price
                selectedPriceIndex = null
            } else {
                isManualPriceMode = false
                manualPrice = null
                selectedPriceIndex = initial.price_position ?? 0
            }
        } else {
            qty = '1'
            manualPrice = null
            isManualPriceMode = !hasPricesNow
            selectedPriceIndex = hasPricesNow ? 0 : null
            priceValue = hasPricesNow ? (product.prices[0]?.sale_price ?? 0) : 0
        }
    })

    const cost = $derived(product?.cost ?? 0)
    const prices = $derived(product?.prices ?? [])
    const hasPrices = $derived(prices.length > 0)

    const quantity = $derived(parseDecimal(qty))
    const qtyForCalc = $derived(Number.isFinite(quantity) ? quantity : 0)
    const amountValue = $derived(manualPrice ?? 0)
    const isAmountMode = $derived(isAutoCalcMode && amountValue > 0)

    const calculatedProfit = $derived(lineProfit(priceValue, cost, qtyForCalc))
    const calculatedMargin = $derived(calculateMarginFromPrices(priceValue, cost))
    // En modo cálculo por monto el TOTAL es el monto digitado, exacto; si no,
    // precio × cantidad. Ambos a 2 decimales.
    const calculatedTotal = $derived(
        isAmountMode ? roundToDecimals(amountValue, 2) : lineTotal(priceValue, qtyForCalc)
    )

    const validQty = $derived(Number.isFinite(quantity) && quantity > 0)
    const canAdd = $derived(validQty && priceValue > 0 && priceValue >= cost)
    const belowCost = $derived(priceValue > 0 && priceValue < cost)

    // --- Handlers (fieles a useProductConfigurator de placepos) ---
    const setQty = (value: number) => {
        qty = String(Math.max(0, roundToDecimals(value, 4)))
    }
    const stepQty = (delta: number) => {
        const current = Number.isFinite(quantity) ? quantity : 0
        setQty(delta < 0 ? Math.max(1, current - 1) : current + 1)
    }

    const handlePriceSelect = (index: number, salePrice: number) => {
        selectedPriceIndex = index
        priceValue = salePrice
        if (isAutoCalcMode && amountValue > 0 && salePrice > 0) {
            setQty(quantityFromAmount(amountValue, salePrice))
        } else {
            isManualPriceMode = false
            manualPrice = null
        }
    }

    const handleManualFocus = () => {
        if (isAutoCalcMode) return
        selectedPriceIndex = null
        isManualPriceMode = true
    }

    const handleManualBlur = () => {
        if (isAutoCalcMode) return
        if (amountValue <= 0) {
            isManualPriceMode = false
            selectedPriceIndex = 0
            priceValue = prices[0]?.sale_price ?? 0
        }
    }

    const handleManualChange = (value: number | null) => {
        manualPrice = value
        const v = value ?? 0
        if (isAutoCalcMode) {
            const unitPrice =
                (selectedPriceIndex !== null
                    ? prices[selectedPriceIndex]?.sale_price
                    : prices[0]?.sale_price) ?? 0
            if (unitPrice > 0 && v > 0) setQty(quantityFromAmount(v, unitPrice))
            priceValue = unitPrice
        } else if (v > 0) {
            isManualPriceMode = true
            selectedPriceIndex = null
            priceValue = v
        }
    }

    const toggleAutoCalc = (enabled: boolean) => {
        isAutoCalcMode = enabled
        if (enabled) {
            manualPrice = null
            qty = '1'
            if (selectedPriceIndex === null) {
                selectedPriceIndex = 0
                priceValue = prices[0]?.sale_price ?? 0
            }
        } else {
            isManualPriceMode = false
            manualPrice = null
            const currentIndex = selectedPriceIndex ?? 0
            selectedPriceIndex = currentIndex
            priceValue = prices[currentIndex]?.sale_price ?? 0
            qty = '1'
        }
    }

    const confirm = () => {
        if (!canAdd || !product) return
        const line = buildConfiguredLine({
            price: priceValue,
            cost: product.cost,
            quantity,
            manualPrice: amountValue,
            isAutoCalcMode
        })
        onConfirm({
            item_id: product.id,
            name: product.name,
            cost: product.cost,
            quantity: line.quantity,
            price: line.price,
            price_mode: line.isManual ? 'manual' : 'fixed',
            price_position: line.isManual ? null : selectedPriceIndex,
            note: note.trim() || null,
            total: line.total,
            profit: line.profit,
            margin: line.margin
        })
    }
</script>

{#if visible}
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
        <!-- Backdrop -->
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-black/40"
            onclick={onClose}
        ></button>

        {#if product}
            <div
                class="relative max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card px-5 pt-3"
                style="padding-bottom:calc(env(safe-area-inset-bottom) + 16px)"
            >
                <div
                    class="mb-4 h-1 w-10 self-center rounded-full bg-border"
                    style="margin-inline:auto"
                ></div>
                <p class="truncate text-base font-bold text-foreground">{product.name}</p>
                <p class="mb-4 text-xs text-muted-foreground">
                    Stock: {formatNumber(product.stock)}
                </p>

                <!-- Cantidad -->
                <p class="mb-2 text-[13px] font-semibold text-foreground/70">Cantidad</p>
                <div class="mb-4 flex flex-row items-center gap-3">
                    <button
                        type="button"
                        class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary active:opacity-70"
                        onclick={() => stepQty(-1)}
                        aria-label="Disminuir"
                    >
                        <Minus size={18} color="hsl(215, 16%, 40%)" strokeWidth={2.5} />
                    </button>
                    <div
                        class="flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-card px-3"
                    >
                        <input
                            bind:value={qty}
                            inputmode="decimal"
                            class="w-full bg-transparent text-center text-base font-bold text-foreground outline-none"
                            style="caret-color:hsl(217, 91%, 50%)"
                        />
                    </div>
                    <button
                        type="button"
                        class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary active:opacity-70"
                        onclick={() => stepQty(1)}
                        aria-label="Aumentar"
                    >
                        <Plus size={18} color="hsl(215, 16%, 40%)" strokeWidth={2.5} />
                    </button>
                </div>

                <!-- Lista de Precios -->
                <p class="mb-2 text-[13px] font-semibold text-foreground/70">Lista de Precios</p>
                <div class="mb-4 flex flex-row gap-2 overflow-x-auto pb-1">
                    {#each prices.slice(0, 5) as p, i (p.id)}
                        {@const active =
                            selectedPriceIndex === i && (isAutoCalcMode || !isManualPriceMode)}
                        <button
                            type="button"
                            class="flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors active:opacity-80 {active
                                ? 'text-white'
                                : 'bg-secondary text-foreground/80'}"
                            style={active ? 'background-color:hsl(158, 64%, 42%)' : ''}
                            onclick={() => handlePriceSelect(i, p.sale_price)}
                        >
                            {formatCurrency(p.sale_price)}
                        </button>
                    {/each}
                </div>

                <!-- Precio Personalizado / Monto Total -->
                <div class="mb-4">
                    <MoneyInput
                        label={isAutoCalcMode ? 'Monto Total' : 'Precio Personalizado'}
                        value={manualPrice}
                        onValueChange={handleManualChange}
                        onfocus={handleManualFocus}
                        onblur={handleManualBlur}
                        highlight={isManualPriceMode || isAutoCalcMode}
                        prefix="$ "
                        placeholder={isAutoCalcMode ? 'Ingrese monto total' : 'Ingrese precio manual'}
                    />
                </div>

                <!-- Cálculo por monto -->
                <div class="mb-4">
                    <ToggleSwitch
                        checked={isAutoCalcMode}
                        onChange={toggleAutoCalc}
                        icon={Scale}
                        label="Cálculo por monto"
                        description="Cantidad automática según total ingresado"
                    />
                </div>

                <!-- Nota -->
                <div class="mb-4 flex h-11 items-center rounded-xl border border-border bg-card px-3.5">
                    <input
                        bind:value={note}
                        placeholder="Nota (opcional)"
                        class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
                        style="caret-color:hsl(217, 91%, 50%)"
                    />
                </div>

                <!-- Ganancia / Margen / Total -->
                <div class="mb-4 rounded-xl bg-secondary/60 p-4">
                    {#if canViewProductProfit}
                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-sm text-muted-foreground">Ganancia:</span>
                            <span
                                class="text-sm font-medium {calculatedProfit >= 0
                                    ? 'text-success'
                                    : 'text-destructive'}"
                            >
                                {formatCurrency(calculatedProfit)}
                            </span>
                        </div>
                    {/if}
                    {#if canViewProductMargin}
                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-sm text-muted-foreground">Margen:</span>
                            <span
                                class="text-sm font-medium {calculatedMargin >= 0
                                    ? 'text-success'
                                    : 'text-destructive'}"
                            >
                                {calculatedMargin.toFixed(2)}%
                            </span>
                        </div>
                    {/if}
                    <div
                        class="flex items-center justify-between {canViewAnyProfitMetric
                            ? 'border-t border-border pt-2'
                            : ''}"
                    >
                        <span class="text-sm font-medium text-foreground">Total:</span>
                        <span class="text-lg font-bold text-foreground"
                            >{formatCurrency(calculatedTotal)}</span
                        >
                    </div>
                </div>

                {#if belowCost}
                    <p class="mb-2 text-xs text-destructive">
                        El precio no puede ser menor al costo.
                    </p>
                {/if}

                <!-- Acciones -->
                <div class="flex flex-row gap-3">
                    <button
                        type="button"
                        class="flex h-[52px] flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70"
                        onclick={onClose}
                    >
                        <span class="font-semibold text-foreground">Cancelar</span>
                    </button>
                    <div class="flex-1">
                        <PrimaryButton label="Agregar" onclick={confirm} disabled={!canAdd} />
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}
