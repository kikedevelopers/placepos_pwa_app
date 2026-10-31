<script lang="ts">
    import {
        ArrowUpRight,
        Bike,
        CheckCircle2,
        ClipboardList,
        CreditCard,
        LoaderCircle,
        MessageSquareText,
        MessageSquareWarning,
        PencilLine,
        Phone,
        Receipt,
        RotateCcw,
        ShoppingCart,
        Store,
        XCircle
    } from '@lucide/svelte'
    import type { Snippet } from 'svelte'
    import { slide } from 'svelte/transition'
    import { cn } from '$lib/utils'
    import { formatCurrency } from '$lib/utils/numbers'
    import { easeOutStrong } from '$lib/utils/easing'
    import type { IconComponent } from '$lib/types/icon'
    import type { AgentOrder, AgentOrderStatus } from '$lib/api/requests/agentOrders/types'
    import {
        channelAccountLabel,
        channelLabel,
        chatIdentity,
        chatWhatsappLink,
        contactPhone,
        customerLabel,
        formatPhone,
        fullDateLabel,
        initialsOf,
        orderAsText,
        quantityLabel,
        waitingLabel
    } from '../utils/agentOrders'
    import { orderActions, statusTrail } from '../utils/orderActions'
    import ChannelMark from './ChannelMark.svelte'
    import CopyButton from './CopyButton.svelte'
    import StatusPill from './StatusPill.svelte'
    import TicketChip from './TicketChip.svelte'

    /**
     * Detalle del pedido, armado para facturarlo sin volver al chat: quién y cómo
     * contactarlo, entrega, pago, canal y productos. Las acciones viven en una
     * barra fija abajo (al alcance del pulgar): llevarlo al POS, tomarlo o
     * descartarlo; si ya está en un ticket, verlo.
     */
    interface Props {
        order: AgentOrder
        isUpdating: boolean
        error: string | null
        canUsePos: boolean
        onChangeStatus: (status: AgentOrderStatus, note?: string) => Promise<boolean>
        onTakeToPos: () => void
        onOpenTicket: (ticketId: number) => void
    }
    let { order, isUpdating, error, canUsePos, onChangeStatus, onTakeToPos, onOpenTicket }: Props =
        $props()

    let dismissing = $state(false)
    let reason = $state('')

    // Otro pedido: se cierra el descarte a medias.
    $effect(() => {
        void order.id
        dismissing = false
        reason = ''
    })

    const name = $derived(customerLabel(order))
    const phone = $derived(contactPhone(order))
    const waLink = $derived(chatWhatsappLink(order))
    const identity = $derived(chatIdentity(order))
    const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '')
    // El cliente dio un teléfono distinto al del chat (otro número de contacto).
    const showOtherPhone = $derived(
        Boolean(order.customer_phone?.trim()) && !digits(order.chat_phone).endsWith(digits(order.customer_phone))
    )
    const account = $derived(channelAccountLabel(order))
    const chatName = $derived(order.chat_display_name?.trim() ?? '')
    const actions = $derived(orderActions(order, canUsePos))
    const liveTicket = $derived(order.ticket && !order.ticket.is_voided ? order.ticket : null)

    const confirmDismiss = async () => {
        if (await onChangeStatus('dismissed', reason.trim() || undefined)) dismissing = false
    }
</script>

{#snippet field(icon: IconComponent, label: string, content: Snippet, trailing?: Snippet)}
    {@const Icon = icon}
    <div class="row flex items-start gap-3 px-4 py-3">
        <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-foreground/[0.05] text-muted-foreground">
            <Icon size={15} strokeWidth={2.1} />
        </span>
        <div class="min-w-0 flex-1">
            <p class="text-[12px] text-muted-foreground">{label}</p>
            <div class="mt-0.5 text-[14.5px] leading-snug text-foreground">{@render content()}</div>
        </div>
        {#if trailing}<div class="-my-1 -mr-1.5 flex items-center">{@render trailing()}</div>{/if}
    </div>
{/snippet}

<article aria-label={`Pedido ${order.reference}`} class="flex min-h-0 flex-1 flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
        <!-- Referencia, estado y copiar. -->
        <div class="flex items-center gap-2 pt-1">
            <span class="text-[13px] font-medium tabular-nums text-muted-foreground">{order.reference}</span>
            <StatusPill {order} />
            <span class="flex-1"></span>
            <CopyButton value={orderAsText(order)} label="pedido" class="bg-foreground/[0.05]" />
        </div>

        <!-- El cliente pidió algo sobre un pedido YA tomado: el agente no lo tocó. -->
        {#if order.customer_request}
            <div role="note" class="mt-3 flex gap-2.5 rounded-[16px] bg-warning/[0.12] px-3.5 py-3">
                <MessageSquareWarning size={17} strokeWidth={2.2} class="mt-0.5 shrink-0 text-[hsl(32_95%_38%)] dark:text-warning" />
                <div class="min-w-0 text-[13px] leading-snug">
                    <p class="font-semibold text-[hsl(32_95%_26%)] dark:text-warning">
                        El cliente pidió un cambio
                        {#if order.customer_request_at}
                            <span class="font-normal opacity-80"> · {waitingLabel(order.customer_request_at)}</span>
                        {/if}
                    </p>
                    <p class="mt-0.5 text-foreground/85">{order.customer_request}</p>
                    <p class="mt-1 text-[12px] text-muted-foreground">El pedido ya estaba tomado: contáctalo para atenderla.</p>
                </div>
            </div>
        {/if}

        <!-- Quién. -->
        <div class="mt-4 flex items-center gap-3.5">
            <span
                class="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(217_91%_58%)] to-[hsl(232_75%_52%)] text-[17px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_-6px_rgba(37,99,235,0.5)]"
            >
                {initialsOf(name)}
                <ChannelMark channel={order.channel} class="absolute -bottom-0.5 -right-0.5 h-5 w-5 ring-2 ring-card" />
            </span>
            <div class="min-w-0">
                <h2 class="truncate text-[20px] font-semibold tracking-[-0.025em] text-foreground">{name}</h2>
                <p class="mt-0.5 truncate text-[13px] text-muted-foreground first-letter:uppercase">{fullDateLabel(order.created_at)}</p>
                {#if order.customer_updated_at}
                    <p class="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-semibold text-primary">
                        <PencilLine size={12} strokeWidth={2.3} />
                        Actualizado por el cliente · {waitingLabel(order.customer_updated_at)}
                    </p>
                {/if}
            </div>
        </div>

        <!-- El chat del cliente, a la vista: para escribirle. -->
        <div class="mt-4 flex items-center gap-2 rounded-[16px] bg-foreground/[0.045] py-1.5 pl-3.5 pr-1.5">
            <ChannelMark channel={order.channel} class="h-5 w-5 shrink-0" />
            <span
                class={cn(
                    'min-w-0 flex-1 truncate',
                    identity.phone
                        ? 'text-[15px] font-semibold tabular-nums tracking-[-0.01em] text-foreground'
                        : 'text-[13px] text-muted-foreground'
                )}
            >
                {identity.label}
            </span>
            {#if identity.phone}<CopyButton value={identity.label} label="número del chat" />{/if}
            {#if identity.phone && waLink}
                <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-[#25D366]/[0.14] px-3 text-[13px] font-semibold text-[#128C4B] transition-transform duration-150 ease-out active:scale-[0.96] dark:text-[#25D366]"
                >
                    Escribirle
                    <ArrowUpRight size={14} strokeWidth={2.3} />
                </a>
            {/if}
        </div>

        <!-- Cuánto. -->
        <p class="mt-5 text-[34px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-foreground">
            {formatCurrency(order.total)}
        </p>
        <p class="mt-1.5 text-[13px] text-muted-foreground">
            {order.items_count === 1 ? '1 producto' : `${order.items_count} productos`}{order.payment_method
                ? ` · ${order.payment_method}`
                : ''}
        </p>

        {#if order.status !== 'pending'}
            <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-muted-foreground">
                {#if order.ticket}<TicketChip ticket={order.ticket} onOpen={onOpenTicket} />{/if}
                <span>
                    {statusTrail(order)}{order.status_changed_at ? ` · ${fullDateLabel(order.status_changed_at)}` : ''}
                </span>
                {#if order.status_note}
                    <span class="basis-full text-foreground/80">“{order.status_note}”</span>
                {/if}
            </div>
        {/if}

        <!-- Productos, tipo factura. -->
        <section aria-label="Productos" class="mt-6">
            <h3 class="mb-2 px-1 text-[13px] font-semibold text-foreground">Productos</h3>
            <div class="surface group-rows overflow-hidden">
                {#each order.items as item, index (`${item.product_id}-${index}`)}
                    <div class="row flex items-start gap-3 px-4 py-3">
                        <span class="mt-px flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] px-1.5 text-[12px] font-semibold tabular-nums text-foreground">
                            {quantityLabel(item.quantity)}
                        </span>
                        <span class="min-w-0 flex-1">
                            <span class="block text-[14.5px] leading-snug text-foreground">{item.name}</span>
                            <span class="mt-0.5 block text-[12.5px] tabular-nums text-muted-foreground">
                                {formatCurrency(item.unit_price)} c/u
                            </span>
                        </span>
                        <span class="shrink-0 text-[14.5px] font-medium tabular-nums text-foreground">{formatCurrency(item.total)}</span>
                    </div>
                {/each}
                <div class="row flex items-center justify-between bg-foreground/[0.025] px-4 py-3.5">
                    <span class="text-[14.5px] font-semibold text-foreground">Total</span>
                    <span class="text-[15.5px] font-semibold tabular-nums text-foreground">{formatCurrency(order.total)}</span>
                </div>
            </div>
        </section>

        <!-- Entrega, pago y canal. -->
        <section aria-label="Datos del pedido" class="mt-5">
            <h3 class="mb-2 px-1 text-[13px] font-semibold text-foreground">Entrega y pago</h3>
            <div class="surface group-rows overflow-hidden">
                {#if showOtherPhone || !phone}
                    {#snippet phoneContent()}
                        {#if phone}
                            <span class="tabular-nums">{formatPhone(phone)}</span>
                        {:else}
                            <span class="text-muted-foreground">No lo dio en la charla</span>
                        {/if}
                        {#if chatName && chatName !== name}
                            <span class="block text-[12.5px] text-muted-foreground">En el chat: {chatName}</span>
                        {/if}
                    {/snippet}
                    {#snippet phoneCopy()}<CopyButton value={phone ?? ''} label="teléfono de contacto" />{/snippet}
                    {@render field(Phone, 'Teléfono de contacto', phoneContent, showOtherPhone && phone ? phoneCopy : undefined)}
                {/if}

                {#snippet deliveryContent()}
                    {#if order.delivery_mode === 'recoger'}
                        Recoge en el negocio
                    {:else if order.delivery_address}
                        {order.delivery_address}
                    {:else}
                        <span class="text-muted-foreground">Sin dirección</span>
                    {/if}
                {/snippet}
                {#snippet addressCopy()}<CopyButton value={order.delivery_address ?? ''} label="dirección" />{/snippet}
                {@render field(
                    order.delivery_mode === 'recoger' ? Store : Bike,
                    order.delivery_mode === 'recoger' ? 'Entrega' : 'Domicilio',
                    deliveryContent,
                    order.delivery_address ? addressCopy : undefined
                )}

                {#snippet paymentContent()}
                    {#if order.payment_method}{order.payment_method}{:else}<span class="text-muted-foreground">No la indicó</span>{/if}
                {/snippet}
                {@render field(CreditCard, 'Forma de pago', paymentContent)}

                {#snippet channelContent()}
                    {channelLabel(order.channel)}{#if account}<span class="text-muted-foreground"> · <span class="tabular-nums">{account}</span></span>{/if}
                {/snippet}
                {@render field(MessageSquareText, 'Atendido por el agente en', channelContent)}

                {#if order.notes}
                    {#snippet notesContent()}<span class="whitespace-pre-line">{order.notes}</span>{/snippet}
                    {@render field(ClipboardList, 'Notas del cliente', notesContent)}
                {/if}
            </div>
        </section>
    </div>

    <!-- Acciones al alcance del pulgar. -->
    <footer class="shrink-0 border-t border-foreground/[0.06] bg-card/95 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 backdrop-blur-md">
        {#if error}
            <p role="alert" class="mb-2.5 rounded-[12px] bg-destructive/[0.07] px-3 py-2 text-[13px] text-destructive">{error}</p>
        {/if}

        {#if dismissing}
            <div transition:slide={{ duration: 220, easing: easeOutStrong }} class="mb-3">
                <label for={`dismiss-${order.id}`} class="mb-1.5 block text-[13px] font-semibold text-foreground">
                    ¿Por qué lo descartas? <span class="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <textarea
                    id={`dismiss-${order.id}`}
                    bind:value={reason}
                    maxlength={250}
                    rows={2}
                    placeholder="Ej.: el cliente canceló, pedido duplicado…"
                    class="w-full resize-none rounded-[14px] bg-foreground/[0.05] px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-[background-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 focus:bg-card focus:shadow-[0_0_0_1.5px_hsl(var(--destructive)/0.5)]"
                ></textarea>
                <div class="mt-2.5 grid grid-cols-2 gap-2.5">
                    <button type="button" onclick={() => (dismissing = false)} class="btn bg-foreground/[0.06] text-foreground">Cancelar</button>
                    <button type="button" disabled={isUpdating} onclick={() => void confirmDismiss()} class="btn bg-destructive text-destructive-foreground">
                        {#if isUpdating}<LoaderCircle size={17} class="animate-spin" />{:else}<XCircle size={17} strokeWidth={2.2} />{/if}
                        Descartar
                    </button>
                </div>
            </div>
        {:else}
            <div class="flex flex-col gap-2.5">
                {#if actions.primary === 'ticket' && liveTicket}
                    <button type="button" onclick={() => onOpenTicket(liveTicket.id)} class="btn bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.65)]">
                        <Receipt size={17} strokeWidth={2.2} />
                        Ver ticket {liveTicket.number}
                    </button>
                {:else if actions.primary === 'pos'}
                    <button type="button" onclick={onTakeToPos} disabled={isUpdating} class="btn bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.65)]">
                        <ShoppingCart size={17} strokeWidth={2.2} />
                        Llevar al POS
                    </button>
                {/if}

                {#if actions.canMarkTaken || actions.canDismiss}
                    <div class="grid grid-cols-2 gap-2.5">
                        <button type="button" disabled={isUpdating} onclick={() => void onChangeStatus('taken')} class="btn bg-success/[0.12] text-success">
                            {#if isUpdating}<LoaderCircle size={17} class="animate-spin" />{:else}<CheckCircle2 size={17} strokeWidth={2.2} />{/if}
                            Tomado
                        </button>
                        <button type="button" disabled={isUpdating} onclick={() => (dismissing = true)} class="btn bg-destructive/[0.08] text-destructive">
                            <XCircle size={17} strokeWidth={2.2} />
                            Descartar
                        </button>
                    </div>
                {:else if actions.canReturnPending}
                    <button type="button" disabled={isUpdating} onclick={() => void onChangeStatus('pending')} class="btn bg-foreground/[0.06] text-foreground">
                        {#if isUpdating}<LoaderCircle size={17} class="animate-spin" />{:else}<RotateCcw size={17} strokeWidth={2.2} />{/if}
                        Devolver a por tomar
                    </button>
                {:else if actions.returnBlockedReason}
                    <p class="text-center text-[12.5px] text-muted-foreground">{actions.returnBlockedReason}</p>
                {/if}
            </div>
        {/if}
    </footer>
</article>

<style>
    .btn {
        display: inline-flex;
        height: 48px;
        width: 100%;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 16px;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.01em;
        transition:
            transform 140ms cubic-bezier(0.23, 1, 0.32, 1),
            opacity 140ms ease;
    }
    .btn:active:not(:disabled) {
        transform: scale(0.97);
    }
    .btn:disabled {
        opacity: 0.55;
    }
</style>
