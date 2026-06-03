<script lang="ts">
    import { ChevronRight } from '@lucide/svelte'
    import type { CreditReportItem, CreditStatus } from '$lib/api/requests/reports'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import { ticketViewer } from '$lib/components/TicketViewer'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatShortDate } from '$lib/utils/dates'
    import Badge, { type BadgeTone } from './Badge.svelte'
    import LineRow from './LineRow.svelte'

    interface Props {
        credit: CreditReportItem
    }
    let { credit }: Props = $props()

    const STATUS: Record<CreditStatus, { label: string; tone: BadgeTone }> = {
        PENDING: { label: 'Pendiente', tone: 'warning' },
        PARTIALLY_PAID: { label: 'Parcial', tone: 'primary' },
        PAID: { label: 'Pagado', tone: 'success' }
    }

    const status = $derived(STATUS[credit.status])
    const number = $derived(credit.saleNumber ?? credit.ticketNumber)

    // Chip de vencimiento (paridad placepos): solo para créditos con saldo.
    // Vencida (rojo) / vence hoy (ámbar) / días restantes (azul).
    const due = $derived.by((): { label: string; tone: BadgeTone } | null => {
        if (credit.status === 'PAID' || credit.balance <= 0 || !credit.dueDate) return null
        const ONE_DAY = 86_400_000
        const start = (iso: string) => {
            const d = new Date(iso)
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        }
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const days = Math.round((start(credit.dueDate) - today) / ONE_DAY)
        const plural = (n: number) => (Math.abs(n) === 1 ? '' : 's')
        if (days < 0) return { label: `Vencida hace ${Math.abs(days)} día${plural(days)}`, tone: 'destructive' }
        if (days === 0) return { label: 'Vence hoy', tone: 'warning' }
        return { label: `Faltan ${days} día${plural(days)}`, tone: 'primary' }
    })
</script>

<!-- `credit.id` es el sale_invoice_id, así que abre el mismo detalle que ventas. -->
<PressableScale
    as="div"
    onclick={() => ticketViewer.open(credit.id)}
    ariaLabel={`Ver detalle del crédito ${number}`}
    class="block w-full text-left"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div class="rounded-2xl border border-border bg-card p-4">
        <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Badge label="CRD" tone="primary" />
                <span class="text-sm font-semibold text-foreground">{number}</span>
            </div>
            <div class="flex items-center gap-1.5">
                <Badge label={status.label} tone={status.tone} />
                <ChevronRight size={16} color="hsl(215, 16%, 65%)" />
            </div>
        </div>

        <div class="flex items-center justify-between gap-2">
            <p class="truncate text-sm text-foreground">{credit.customerName}</p>
            {#if due}
                <span class="shrink-0"><Badge label={due.label} tone={due.tone} /></span>
            {/if}
        </div>
        <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
            {credit.createdBy ? `por ${credit.createdBy} · ` : ''}
            {formatShortDate(credit.createdAt)}
        </p>

        <div class="mt-2 border-t border-border/60 pt-2">
            <LineRow label="Total" value={formatCurrency(credit.totalAmount)} />
            <LineRow
                label="Abonado"
                value={formatCurrency(credit.paidAmount)}
                tone={credit.paidAmount > 0 ? 'asset' : 'muted'}
            />
            <LineRow
                label="Saldo"
                value={formatCurrency(credit.balance)}
                tone={credit.balance > 0 ? 'liability' : 'asset'}
                bold
            />
        </div>
    </div>
</PressableScale>
