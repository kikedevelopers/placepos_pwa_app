<script lang="ts">
    import {
        Ban,
        Bell,
        Check,
        LoaderCircle,
        MessageSquareWarning,
        PencilLine,
        ReceiptText,
        ShoppingBag,
        Store,
        UserRoundX
    } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { IconComponent } from '$lib/types/icon'
    import type { AppAlert } from '$lib/api/requests/appAlerts/types'
    import { compactTime, titleOf, toneOf, type NotificationTone } from '../utils/notifications'

    /**
     * Una notificación: icono del tipo, título, mensaje, hora y, si es un pedido,
     * su referencia y monto. La no leída lleva un punto y un fondo apenas
     * tintado. En el teléfono no hay hover: "marcar leída" queda siempre a mano.
     */
    interface Props {
        alert: AppAlert
        hasTarget: boolean
        /** Nombre de la sucursal donde pasó, si no es el negocio actual. */
        branchName?: string | null
        isMarking?: boolean
        onOpen: (alert: AppAlert) => void
        onMarkRead: (id: number) => void
    }
    let { alert, hasTarget, branchName = null, isMarking = false, onOpen, onMarkRead }: Props = $props()

    const TONE: Record<NotificationTone, { icon: IconComponent; tile: string }> = {
        order: { icon: ShoppingBag, tile: 'bg-primary/10 text-primary' },
        'order-updated': { icon: PencilLine, tile: 'bg-info/10 text-info' },
        'order-cancelled': { icon: Ban, tile: 'bg-destructive/10 text-destructive' },
        'order-request': { icon: MessageSquareWarning, tile: 'bg-warning/[0.14] text-warning' },
        expense: { icon: ReceiptText, tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
        customer: { icon: UserRoundX, tile: 'bg-success/10 text-success' },
        neutral: { icon: Bell, tile: 'bg-foreground/[0.06] text-muted-foreground' }
    }

    const tone = $derived(TONE[toneOf(alert)])
    const unread = $derived(!alert.is_read)
    const payload = $derived(alert.payload ?? { message: '' })
    const title = $derived(titleOf(alert))
    const reference = $derived(typeof payload.reference === 'string' ? payload.reference : '')
    const Icon = $derived(tone.icon)
</script>

<li class="relative">
    <button
        type="button"
        disabled={!hasTarget && !unread}
        onclick={() => (hasTarget ? onOpen(alert) : onMarkRead(alert.id))}
        aria-label={`${title}. ${payload.message ?? ''}`}
        class={cn(
            'flex w-full gap-3 rounded-[18px] px-3 py-3 pr-12 text-left transition-[background-color,transform] duration-150 ease-out',
            'active:scale-[0.985] active:bg-foreground/[0.05] disabled:active:scale-100',
            unread && 'bg-primary/[0.04]'
        )}
    >
        {#if unread}
            <span aria-hidden="true" class="absolute left-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"></span>
        {/if}
        <span class={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]', tone.tile)}>
            <Icon size={19} strokeWidth={2.1} />
        </span>
        <span class="min-w-0 flex-1">
            <span class="flex items-baseline gap-2">
                <span
                    class={cn(
                        'min-w-0 flex-1 truncate text-[14.5px] tracking-[-0.01em] text-foreground',
                        unread ? 'font-semibold' : 'font-medium'
                    )}
                >
                    {title}
                </span>
                <time datetime={alert.triggered_at} class="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                    {compactTime(alert.triggered_at)}
                </time>
            </span>
            <span
                class={cn(
                    'mt-0.5 line-clamp-2 block text-[13px] leading-snug',
                    unread ? 'text-foreground/80' : 'text-muted-foreground'
                )}
            >
                {payload.message}
            </span>
            {#if reference || branchName}
                <span class="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                    {#if branchName}
                        <span class="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 font-medium text-violet-700 dark:text-violet-300">
                            <Store size={12} strokeWidth={2.2} />
                            {branchName}
                        </span>
                    {/if}
                    {#if reference}
                        <span class="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-medium tabular-nums text-foreground/80">
                            {reference}
                        </span>
                    {/if}
                    {#if typeof payload.total === 'number'}
                        <span class="font-semibold tabular-nums text-foreground">{formatCurrency(payload.total)}</span>
                    {/if}
                </span>
            {/if}
        </span>
    </button>

    {#if unread}
        <button
            type="button"
            onclick={() => onMarkRead(alert.id)}
            disabled={isMarking}
            aria-label="Marcar como leída"
            class="absolute right-2 top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.92] active:bg-foreground/[0.08]"
        >
            {#if isMarking}
                <LoaderCircle size={16} class="animate-spin" />
            {:else}
                <Check size={17} strokeWidth={2.2} />
            {/if}
        </button>
    {/if}
</li>
