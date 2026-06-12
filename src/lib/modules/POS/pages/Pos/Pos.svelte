<script lang="ts">
    import ChevronRight from '@lucide/svelte/icons/chevron-right'
    import ReceiptText from '@lucide/svelte/icons/receipt-text'
    import ShoppingCart from '@lucide/svelte/icons/shopping-cart'
    import Wallet from '@lucide/svelte/icons/wallet'
    import X from '@lucide/svelte/icons/x'
    import { fly } from 'svelte/transition'
    import { cubicOut } from 'svelte/easing'
    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import { createMutation } from '@tanstack/svelte-query'
    import {
        createSale,
        type CreateSalePayload,
        type PosProduct
    } from '$lib/api/requests/pos'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import { TicketViewerHost } from '$lib/components/TicketViewer'
    import { useResponsive } from '$lib/hooks/useResponsive.svelte'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency, roundTo } from '$lib/utils/numbers'
    import { randomUUID } from '$lib/utils/uuid'
    import {
        posCart,
        type CartItem,
        type NewCartItem
    } from '$lib/modules/POS/store/posCart.svelte'
    import { usePosItems } from './hooks/usePosData'
    import type { ChargeOrder } from './hooks/usePayment.svelte'
    import type { ConfiguratorInitial } from './components/ProductConfigurator.svelte'
    import ProductCard from './components/ProductCard.svelte'
    import ProductRow from './components/ProductRow.svelte'
    import ViewModeToggle, { type PosViewMode } from './components/ViewModeToggle.svelte'
    import ProductConfigurator from './components/ProductConfigurator.svelte'
    import CartSheet from './components/CartSheet.svelte'
    import PostActionDialog from './components/PostActionDialog.svelte'
    import ChargeHost from '$lib/components/ChargeHost.svelte'
    import { chargeOrder } from '$lib/stores/chargeOrder.svelte'
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
        customer: { id: number; name: string } | null,
        clientOperationId: string
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
            customer_name: customer?.name ?? null,
            client_operation_id: clientOperationId
        }
    }

    const responsive = useResponsive()
    const cols = $derived(responsive.isTablet ? 4 : 2)

    const itemsQuery = usePosItems()
    const data = $derived($itemsQuery.data)
    const isLoading = $derived($itemsQuery.isLoading)
    const isError = $derived($itemsQuery.isError)
    const error = $derived($itemsQuery.error)

    let search = $state('')
    const debounced = useDebouncedValue(() => search, 200)

    // Modo de vista de productos (cuadros 2 columnas / lista fila a fila),
    // persistido en localStorage. Equivalente al ViewModeToggle de placepos.
    const VIEW_KEY = 'placepos_pwa.pos_view'
    let viewMode = $state<PosViewMode>(
        browser && localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
    )
    const setViewMode = (m: PosViewMode) => {
        viewMode = m
        if (browser) localStorage.setItem(VIEW_KEY, m)
    }

    // Estado de apertura de modales / flujo de 2 fases.
    let config = $state<ConfigState | null>(null)
    let cartOpen = $state(false)
    let scanOpen = $state(false)
    let ticketsOpen = $state(false)
    let cashOpen = $state(false)
    let postOrder = $state<ChargeOrder | null>(null)
    let registerError = $state('')

    // Llave de idempotencia ESTABLE del intento de registro actual. Se genera una
    // vez, se reusa en reintentos (mismo carrito) y se limpia tras un registro
    // exitoso. El backend deduplica por ella: un doble-click jamas crea 2 facturas.
    let registerOperationId: string | null = null

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
        // Guard de doble-submit: si ya hay un registro en vuelo, ignorar el click.
        if ($register.isPending) return
        const cart = posCart.cart
        const customer = posCart.customer
        if (cart.length === 0) return
        // Llave estable: se crea una vez por intento y se reusa hasta que el
        // registro tenga exito (o se reintente con el mismo carrito).
        if (!registerOperationId) registerOperationId = randomUUID()
        const captured = roundTo(
            cart.reduce((a, c) => a + c.total, 0),
            2
        )
        $register.mutate(buildSalePayload(cart, customer, registerOperationId), {
            onSuccess: (result) => {
                const charge: ChargeOrder = {
                    invoice_id: result.invoice_id,
                    ticket_number: result.ticket_number,
                    total: captured,
                    customer_name: customer?.name ?? null
                }
                cartOpen = false
                posCart.clearCart()
                // Registro exitoso: la proxima venta usa una llave nueva.
                registerOperationId = null
                postOrder = charge
            },
            onError: (e) => {
                // No limpiamos la llave: un reintento debe reusar la misma para
                // que el backend lo trate como la MISMA venta (idempotente).
                registerError = getErrorMessage(e) ?? 'No se pudo registrar el pedido.'
            }
        })
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
                <button
                    type="button"
                    onclick={() => (cartOpen = true)}
                    class="relative flex h-10 w-10 items-center justify-center active:opacity-60"
                    aria-label="Carrito"
                >
                    <ShoppingCart size={20} color="hsl(215, 16%, 40%)" strokeWidth={2} />
                    {#if posCart.count > 0}
                        <span
                            class="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-card px-[3px] text-[10px] font-bold leading-none text-white"
                            style="background-color: hsl(0, 84%, 55%)"
                        >
                            {posCart.count}
                        </span>
                    {/if}
                </button>
            </div>
        </div>
    </header>

    <!-- Buscador + toggle de modo de vista (cuadros / lista). -->
    <div class="flex flex-row items-center gap-2 px-5 pb-1 pt-3">
        <div class="flex-1">
            <SearchField
                bind:value={search}
                placeholder="Buscar por nombre, SKU o código"
            />
        </div>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
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
            <div
                class="h-full overflow-y-auto px-5 pt-2 transition-[padding] duration-200"
                class:pb-28={posCart.count > 0}
                class:pb-6={posCart.count === 0}
            >
                {#if viewMode === 'grid'}
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
                {:else}
                    <div class="flex flex-col gap-2.5">
                        {#each products as product (product.id)}
                            <ProductRow
                                {product}
                                onPress={() => (config = { product, initial: null, editId: null })}
                            />
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Barra de carrito acoplada al borde inferior. Solo cuando hay artículos:
         entra/sale con un slide suave. Diseño premium: chip con badge, total
         prominente y CTA "Ver carrito". -->
    {#if posCart.count > 0}
        <div
            class="absolute inset-x-0 bottom-0 z-10"
            transition:fly={{ y: 100, duration: 260, easing: cubicOut }}
        >
            <div
                class="border-t border-border/70 bg-card/95 px-4 pt-3 backdrop-blur-xl"
                style="padding-bottom: calc(env(safe-area-inset-bottom) + 12px); box-shadow: 0 -8px 24px hsla(222, 47%, 11%, 0.10)"
            >
                <button
                    type="button"
                    onclick={() => (cartOpen = true)}
                    class="flex w-full items-center gap-3 text-left transition-transform active:scale-[0.99]"
                >
                    <span
                        class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, hsl(213, 94%, 58%), hsl(217, 91%, 50%)); box-shadow: 0 6px 14px hsla(217, 91%, 50%, 0.4)"
                    >
                        <ShoppingCart size={22} color="white" strokeWidth={2.2} />
                        <span
                            class="absolute -right-1.5 -top-1.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-card px-1 text-[11px] font-bold leading-none text-white"
                            style="background-color: hsl(0, 84%, 55%)"
                        >
                            {posCart.count}
                        </span>
                    </span>

                    <span class="flex min-w-0 flex-1 flex-col">
                        <span class="truncate text-[11px] font-medium text-muted-foreground">
                            {posCart.count}
                            {posCart.count === 1 ? 'artículo' : 'artículos'}{posCart.customer
                                ? ` · ${posCart.customer.name}`
                                : ''}
                        </span>
                        <span class="text-xl font-bold tabular-nums text-foreground">
                            {formatCurrency(posCart.total)}
                        </span>
                    </span>

                    <span
                        class="flex h-11 shrink-0 items-center gap-0.5 rounded-xl pl-4 pr-3 text-sm font-bold text-white"
                        style="background: linear-gradient(135deg, hsl(213, 94%, 58%), hsl(217, 91%, 50%)); box-shadow: 0 6px 14px hsla(217, 91%, 50%, 0.35)"
                    >
                        Ver carrito
                        <ChevronRight size={18} strokeWidth={2.4} />
                    </span>
                </button>
            </div>
        </div>
    {/if}

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
            if (postOrder) chargeOrder.open(postOrder)
            postOrder = null
        }}
        onClose={() => (postOrder = null)}
    />

    <BarcodeScannerModal
        visible={scanOpen}
        onClose={() => (scanOpen = false)}
        {onScanned}
    />
    <DailyTicketsModal visible={ticketsOpen} onClose={() => (ticketsOpen = false)} />
    <CashModal visible={cashOpen} onClose={() => (cashOpen = false)} />

    <!-- Visor de ticket compartido (idéntico al de Reportes): se abre con
         ticketViewer.open(id) desde la lista de tickets del día. -->
    <TicketViewerHost />
    <!-- Host global de cobro (Fase 2 y cobro de pedidos desde el ticket). -->
    <ChargeHost />
</div>
