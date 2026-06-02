<script lang="ts">
    import ReceiptText from '@lucide/svelte/icons/receipt-text'
    import ScanLine from '@lucide/svelte/icons/scan-line'
    import ShoppingCart from '@lucide/svelte/icons/shopping-cart'
    import Wallet from '@lucide/svelte/icons/wallet'
    import X from '@lucide/svelte/icons/x'
    import { goto } from '$app/navigation'
    import { createMutation, useQueryClient } from '@tanstack/svelte-query'
    import {
        createSale,
        type CreateSalePayload,
        type PosProduct
    } from '$lib/api/requests/pos'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import { useResponsive } from '$lib/hooks/useResponsive.svelte'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency, roundTo } from '$lib/utils/numbers'
    import {
        posCart,
        type CartItem,
        type NewCartItem
    } from '$lib/modules/POS/store/posCart.svelte'
    import { usePosItems } from './hooks/usePosData'
    import type { ChargeOrder } from './hooks/usePayment.svelte'
    import type { ConfiguratorInitial } from './components/ProductConfigurator.svelte'
    import ProductCard from './components/ProductCard.svelte'
    import ProductConfigurator from './components/ProductConfigurator.svelte'
    import CartSheet from './components/CartSheet.svelte'
    import PostActionDialog from './components/PostActionDialog.svelte'
    import PaymentModal from './components/PaymentModal.svelte'
    import BarcodeScannerModal from './components/BarcodeScannerModal.svelte'
    import DailyTicketsModal from './components/DailyTicketsModal.svelte'
    import CashModal from './components/CashModal.svelte'

    type ConfigState = {
        product: PosProduct
        initial: ConfiguratorInitial | null
        editId: string | null
    }

    // Construye el payload de POST /sales (fase 1: ORDER). Copia 1:1 de pos_app.
    const buildSalePayload = (
        cart: CartItem[],
        customer: { id: number; name: string } | null
    ): CreateSalePayload => {
        const total = roundTo(
            cart.reduce((a, c) => a + c.total, 0),
            2
        )
        const cost = roundTo(
            cart.reduce((a, c) => a + c.cost * c.quantity, 0),
            2
        )
        const profit = roundTo(total - cost, 2)
        return {
            items: cart.map((c) => ({
                item_id: c.item_id,
                name: c.name,
                cost: c.cost,
                price: c.price,
                quantity: c.quantity,
                total: c.total,
                profit: c.profit,
                margin: c.margin,
                price_mode: c.price_mode,
                price_position: c.price_position,
                note: c.note
            })),
            total,
            cost,
            profit,
            margin: total > 0 ? roundTo((profit / total) * 100, 4) : 0,
            customer_id: customer?.id ?? null,
            customer_name: customer?.name ?? null
        }
    }

    const queryClient = useQueryClient()
    const responsive = useResponsive()
    const cols = $derived(responsive.isTablet ? 4 : 2)

    const itemsQuery = usePosItems()
    const data = $derived($itemsQuery.data)
    const isLoading = $derived($itemsQuery.isLoading)
    const isError = $derived($itemsQuery.isError)
    const error = $derived($itemsQuery.error)

    let search = $state('')
    const debounced = useDebouncedValue(() => search, 200)

    // Estado de apertura de modales / flujo de 2 fases.
    let config = $state<ConfigState | null>(null)
    let cartOpen = $state(false)
    let scanOpen = $state(false)
    let ticketsOpen = $state(false)
    let cashOpen = $state(false)
    let postOrder = $state<ChargeOrder | null>(null)
    let payOrder = $state<ChargeOrder | null>(null)
    let registerError = $state('')

    // Fase 1: createSale (POST /sales) crea el ORDER.
    const register = createMutation({ mutationFn: createSale })

    // Filtrado debounce por name / sku_code / bar_code (copia fiel).
    const products = $derived.by(() => {
        const list = data ?? []
        const q = debounced.value.trim().toLowerCase()
        if (!q) return list
        return list.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.sku_code.toLowerCase().includes(q) ||
                p.bar_code.toLowerCase().includes(q)
        )
    })

    const onConfirmConfig = (item: NewCartItem) => {
        if (config?.editId) {
            posCart.updateCartItem(config.editId, {
                quantity: item.quantity,
                price: item.price,
                price_mode: item.price_mode,
                price_position: item.price_position,
                note: item.note
            })
        } else {
            posCart.addToCart(item)
        }
        config = null
    }

    const onScanned = (code: string) => {
        const product = (data ?? []).find((p) => p.bar_code === code)
        if (product) config = { product, initial: null, editId: null }
        else search = code
    }

    const onEditItem = (item: CartItem) => {
        const product = (data ?? []).find((p) => p.id === item.item_id)
        if (!product) return
        cartOpen = false
        config = {
            product,
            editId: item.id,
            initial: {
                price: item.price,
                quantity: item.quantity,
                price_mode: item.price_mode,
                price_position: item.price_position,
                note: item.note
            }
        }
    }

    const handleRegister = () => {
        registerError = ''
        const cart = posCart.cart
        const customer = posCart.customer
        if (cart.length === 0) return
        const captured = roundTo(
            cart.reduce((a, c) => a + c.total, 0),
            2
        )
        $register.mutate(buildSalePayload(cart, customer), {
            onSuccess: (result) => {
                const charge: ChargeOrder = {
                    invoice_id: result.invoice_id,
                    ticket_number: result.ticket_number,
                    total: captured,
                    customer_name: customer?.name ?? null
                }
                cartOpen = false
                posCart.clearCart()
                postOrder = charge
            },
            onError: (e) => {
                registerError = getErrorMessage(e) ?? 'No se pudo registrar el pedido.'
            }
        })
    }

    // Tras cobrar (incl. DUPLICATE_OPERATION), invalida las 3 keys (verbatim pos_app).
    const onPaid = () => {
        queryClient.invalidateQueries({ queryKey: ['pos', 'items'] })
        queryClient.invalidateQueries({ queryKey: ['sales', 'today'] })
        queryClient.invalidateQueries({ queryKey: ['pos', 'cash-summary'] })
        payOrder = null
    }
</script>

<div class="relative flex h-[100dvh] flex-col bg-background">
    <!-- Header inmersivo (safe-area top). -->
    <header
        class="border-b border-border/70 bg-card"
        style="padding-top: env(safe-area-inset-top)"
    >
        <div class="flex flex-row items-center justify-between px-3 py-2">
            <button
                type="button"
                onclick={() => goto('/')}
                class="flex h-10 w-10 items-center justify-center active:opacity-60"
                aria-label="Cerrar"
            >
                <X size={22} color="hsl(215, 16%, 40%)" />
            </button>
            <span class="text-base font-bold text-foreground">Punto de venta</span>
            <div class="flex flex-row items-center">
                <button
                    type="button"
                    onclick={() => (cashOpen = true)}
                    class="flex h-10 w-10 items-center justify-center active:opacity-60"
                    aria-label="Caja"
                >
                    <Wallet size={20} color="hsl(215, 16%, 40%)" strokeWidth={2} />
                </button>
                <button
                    type="button"
                    onclick={() => (ticketsOpen = true)}
                    class="flex h-10 w-10 items-center justify-center active:opacity-60"
                    aria-label="Tickets del día"
                >
                    <ReceiptText size={20} color="hsl(215, 16%, 40%)" strokeWidth={2} />
                </button>
            </div>
        </div>
    </header>

    <!-- Buscador + botón escáner. -->
    <div class="flex flex-row items-center gap-2 px-5 pb-1 pt-3">
        <div class="flex-1">
            <SearchField
                bind:value={search}
                placeholder="Buscar por nombre, SKU o código"
            />
        </div>
        <button
            type="button"
            onclick={() => (scanOpen = true)}
            class="flex h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80"
            aria-label="Escanear código"
        >
            <ScanLine size={20} color="white" strokeWidth={2.2} />
        </button>
    </div>

    <!-- Estados / grid de productos. -->
    <div class="relative flex-1 overflow-hidden">
        {#if isLoading}
            <ScreenState kind="loading" />
        {:else if isError}
            <ScreenState kind="error" message={getErrorMessage(error)} />
        {:else if products.length === 0}
            <ScreenState kind="empty" message="No hay productos para mostrar." />
        {:else}
            <div class="h-full overflow-y-auto px-5 pb-28 pt-2">
                <div
                    class="grid gap-3"
                    class:grid-cols-2={cols === 2}
                    class:grid-cols-4={cols === 4}
                >
                    {#each products as product (product.id)}
                        <ProductCard
                            {product}
                            onPress={() => (config = { product, initial: null, editId: null })}
                        />
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <!-- Barra flotante "Ver carrito" (safe-area bottom). -->
    <div
        class="absolute bottom-0 left-0 right-0"
        style="padding-bottom: env(safe-area-inset-bottom)"
    >
        <div class="px-5 pb-3">
            <button
                type="button"
                onclick={() => (cartOpen = true)}
                class="flex h-14 flex-row items-center justify-between rounded-2xl px-5 active:opacity-90"
                style="background-color: hsl(217, 91%, 50%); box-shadow: 0 8px 14px hsla(217, 91%, 50%, 0.35)"
            >
                <div class="flex flex-row items-center gap-2">
                    <ShoppingCart size={20} color="white" strokeWidth={2.2} />
                    <span class="font-semibold text-white">Ver carrito ({posCart.count})</span>
                </div>
                <span class="text-base font-bold text-white">{formatCurrency(posCart.total)}</span>
            </button>
        </div>
    </div>

    <!-- Configurador de producto (agregar / editar línea). -->
    <ProductConfigurator
        visible={!!config}
        product={config?.product ?? null}
        initial={config?.initial ?? null}
        onClose={() => (config = null)}
        onConfirm={onConfirmConfig}
    />

    <!-- Carrito. -->
    <CartSheet
        visible={cartOpen}
        onClose={() => (cartOpen = false)}
        {onEditItem}
        onRegister={handleRegister}
        registering={$register.isPending}
        {registerError}
    />

    <!-- Paso intermedio del flujo de 2 fases: ORDER creado → cobrar o dejar pendiente. -->
    <PostActionDialog
        visible={!!postOrder}
        ticketNumber={postOrder?.ticket_number ?? ''}
        onCharge={() => {
            payOrder = postOrder
            postOrder = null
        }}
        onClose={() => (postOrder = null)}
    />

    <!-- Fase 2: processPayment (POST /payments) convierte el ORDER en SALE. -->
    <PaymentModal
        visible={!!payOrder}
        order={payOrder}
        onClose={() => (payOrder = null)}
        onPaid={onPaid}
    />

    <BarcodeScannerModal
        visible={scanOpen}
        onClose={() => (scanOpen = false)}
        {onScanned}
    />
    <DailyTicketsModal visible={ticketsOpen} onClose={() => (ticketsOpen = false)} />
    <CashModal visible={cashOpen} onClose={() => (cashOpen = false)} />
</div>
