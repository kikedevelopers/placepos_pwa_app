<script lang="ts">
    import AlertCircle from '@lucide/svelte/icons/alert-circle'
    import ChevronRight from '@lucide/svelte/icons/chevron-right'
    import ShoppingCart from '@lucide/svelte/icons/shopping-cart'
    import User from '@lucide/svelte/icons/user'
    import X from '@lucide/svelte/icons/x'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { posCart, type CartItem } from '$lib/modules/POS/store/posCart.svelte'
    import CartItemRow from './CartItemRow.svelte'
    import CustomerSelectorView from './CustomerSelectorView.svelte'

    interface Props {
        visible: boolean
        onClose: () => void
        onEditItem: (item: CartItem) => void
        onRegister: () => void
        registering: boolean
        registerError: string
    }
    let { visible, onClose, onEditItem, onRegister, registering, registerError }: Props = $props()

    let view = $state<'cart' | 'customer'>('cart')

    // Al cerrar el sheet, restablece la sub-vista a 'cart' (equivalente a
    // onDismiss={() => setView('cart')} del Modal de pos_app).
    $effect(() => {
        if (!visible) view = 'cart'
    })
</script>

{#if visible}
    <div
        class="fixed inset-0 z-50 flex flex-col bg-background"
        style="padding-top: env(safe-area-inset-top);"
    >
        {#if view === 'customer'}
            <CustomerSelectorView
                selectedId={posCart.customer?.id ?? null}
                onSelect={(c) => {
                    if (c) posCart.setCustomer(c)
                    else posCart.clearCustomer()
                    view = 'cart'
                }}
                onBack={() => (view = 'cart')}
            />
        {:else}
            <div
                class="flex flex-row items-center justify-between border-b border-border/70 bg-card px-3 py-2"
            >
                <button
                    type="button"
                    onclick={onClose}
                    class="flex h-10 w-10 items-center justify-center active:opacity-60"
                    aria-label="Cerrar"
                >
                    <X size={22} color="hsl(215, 16%, 40%)" />
                </button>
                <span class="text-base font-bold text-foreground">Carrito</span>
                <div class="w-10"></div>
            </div>

            <button
                type="button"
                onclick={() => (view = 'customer')}
                class="flex w-full flex-row items-center gap-3 border-b border-border/60 bg-card px-5 py-3 text-left active:opacity-80"
            >
                <div
                    class="flex h-9 w-9 items-center justify-center rounded-full"
                    style="background-color: hsla(217, 91%, 50%, 0.12);"
                >
                    <User size={16} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </div>
                <span class="flex-1 truncate text-sm font-medium text-foreground">
                    {posCart.customer ? posCart.customer.name : 'Agregar cliente'}
                </span>
                <ChevronRight size={18} color="hsl(215, 16%, 60%)" />
            </button>

            <div class="flex-1 overflow-y-auto px-5 pb-4">
                {#if posCart.cart.length === 0}
                    <div class="flex flex-col items-center justify-center py-20">
                        <ShoppingCart size={28} color="hsl(215, 16%, 55%)" strokeWidth={1.8} />
                        <p class="mt-3 text-sm text-muted-foreground">El carrito está vacío.</p>
                    </div>
                {:else}
                    {#each posCart.cart as item (item.id)}
                        <CartItemRow
                            {item}
                            onEdit={() => onEditItem(item)}
                            onRemove={() => posCart.removeFromCart(item.id)}
                        />
                    {/each}
                {/if}
            </div>

            <div
                class="border-t border-border/70 bg-card px-5 pt-3"
                style="padding-bottom: calc(env(safe-area-inset-bottom) + 12px);"
            >
                <div class="mb-3 flex flex-row items-center justify-between">
                    <span class="text-sm text-muted-foreground">Total</span>
                    <span class="text-2xl font-bold text-foreground">{formatCurrency(posCart.total)}</span>
                </div>
                {#if registerError}
                    <div class="mb-3 flex flex-row items-start gap-2">
                        <AlertCircle size={14} color="hsl(0, 84%, 55%)" />
                        <span class="flex-1 text-xs text-destructive">{registerError}</span>
                    </div>
                {/if}
                <PrimaryButton
                    label="Registrar pedido"
                    loading={registering}
                    disabled={posCart.cart.length === 0}
                    onclick={onRegister}
                />
            </div>
        {/if}
    </div>
{/if}
