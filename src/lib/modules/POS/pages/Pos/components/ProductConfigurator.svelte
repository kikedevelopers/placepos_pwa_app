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
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { formatCurrency, parseDecimal, roundTo } from '$lib/utils/numbers'
    import type { NewCartItem } from '$lib/modules/POS/store/posCart.svelte'

    let { visible, product, initial, onClose, onConfirm }: ProductConfiguratorProps = $props()

    // Estado del cuerpo. Se reinicia cada vez que cambia el producto (equivalente
    // al `key={product.id}` que remonta el <Body/> en pos_app).
    let mode = $state<'fixed' | 'manual'>('fixed')
    let position = $state(0)
    let manualPrice = $state<number | null>(null)
    let qty = $state('1')
    let note = $state('')

    let lastProductId = $state<number | null>(null)
    $effect(() => {
        if (product && product.id !== lastProductId) {
            lastProductId = product.id
            const hasPricesNow = product.prices.length > 0
            mode = initial?.price_mode ?? (hasPricesNow ? 'fixed' : 'manual')
            position = initial?.price_position ?? 0
            manualPrice = initial?.price_mode === 'manual' ? initial.price : null
            qty = String(initial?.quantity ?? 1)
            note = initial?.note ?? ''
        }
    })

    const hasPrices = $derived(!!product && product.prices.length > 0)
    const quantity = $derived(parseDecimal(qty))
    const price = $derived(
        mode === 'fixed' && hasPrices
            ? (product?.prices[position]?.sale_price ?? 0)
            : (manualPrice ?? 0)
    )
    const validQty = $derived(Number.isFinite(quantity) && quantity > 0)
    const total = $derived(validQty ? roundTo(price * quantity, 2) : 0)
    const canAdd = $derived(validQty && price > 0 && !!product && price >= product.cost)

    const stepQty = (delta: number) => {
        const next = Math.max(0, roundTo((Number.isFinite(quantity) ? quantity : 0) + delta, 4))
        qty = String(next)
    }

    const confirm = () => {
        if (!canAdd || !product) return
        onConfirm({
            item_id: product.id,
            name: product.name,
            cost: product.cost,
            quantity,
            price,
            price_mode: mode,
            price_position: mode === 'fixed' && hasPrices ? position : null,
            note: note.trim() || null
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
                class="relative rounded-t-3xl bg-card px-5 pt-3"
                style="padding-bottom:calc(env(safe-area-inset-bottom) + 16px)"
            >
                <div class="mb-4 h-1 w-10 self-center rounded-full bg-border" style="margin-inline:auto"></div>
                <p class="truncate text-base font-bold text-foreground">{product.name}</p>
                <p class="mb-4 text-xs text-muted-foreground">Costo {formatCurrency(product.cost)}</p>

                <p class="mb-2 text-[13px] font-semibold text-foreground/70">Precio</p>
                <div class="mb-3 flex flex-row flex-wrap gap-2">
                    {#each product.prices as p, i (p.id)}
                        {@const active = mode === 'fixed' && position === i}
                        <button
                            type="button"
                            class="rounded-full border px-3.5 py-2 active:opacity-80 {active
                                ? 'border-transparent'
                                : 'border-border'}"
                            style="background-color:{active ? 'hsl(217, 91%, 50%)' : 'hsl(0, 0%, 100%)'}"
                            onclick={() => {
                                mode = 'fixed'
                                position = i
                            }}
                        >
                            <span
                                class="text-xs font-semibold {active ? 'text-white' : 'text-foreground'}"
                            >
                                {product.prices.length > 1 ? `P${i + 1}: ` : ''}{formatCurrency(
                                    p.sale_price
                                )}
                            </span>
                        </button>
                    {/each}
                    <button
                        type="button"
                        class="rounded-full border border-dashed px-3.5 py-2 active:opacity-80 {mode ===
                        'manual'
                            ? 'border-primary'
                            : 'border-border'}"
                        onclick={() => (mode = 'manual')}
                    >
                        <span
                            class="text-xs font-semibold {mode === 'manual'
                                ? 'text-primary'
                                : 'text-muted-foreground'}"
                        >
                            Manual
                        </span>
                    </button>
                </div>

                {#if mode === 'manual'}
                    <div class="mb-3">
                        <MoneyInput
                            value={manualPrice}
                            onValueChange={(v) => (manualPrice = v)}
                            prefix="$ "
                        />
                    </div>
                {/if}

                <p class="mb-2 text-[13px] font-semibold text-foreground/70">Cantidad</p>
                <div class="mb-3 flex flex-row items-center gap-3">
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
                            class="w-full bg-transparent text-center text-base text-foreground outline-none"
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

                <div
                    class="mb-3 flex h-11 items-center rounded-xl border border-border bg-card px-3.5"
                >
                    <input
                        bind:value={note}
                        placeholder="Nota (opcional)"
                        class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
                        style="caret-color:hsl(217, 91%, 50%)"
                    />
                </div>

                <div class="mb-3 flex flex-row items-center justify-between">
                    <span class="text-sm text-muted-foreground">Total</span>
                    <span class="text-xl font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
                {#if price > 0 && product && price < product.cost}
                    <p class="mb-2 text-xs text-destructive">
                        El precio no puede ser menor al costo.
                    </p>
                {/if}

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
