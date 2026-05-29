<script lang="ts">
    import { Mail, MapPin, Phone, Receipt, StickyNote, User } from '@lucide/svelte'
    import type { CompanyProfile } from '$lib/api/requests/authentication/types'
    import type { SaleDetail } from '$lib/api/requests/sales'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'

    interface Props {
        sale: SaleDetail
        company: CompanyProfile | null
    }
    let { sale, company }: Props = $props()

    // "Papel": colores fijos blanco/negro, independientes del tema.
    const INK = '#111827'
    const SUB = '#6b7280'

    const formatDate = (iso: string): string =>
        new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(iso))

    const isOrder = $derived(sale.ticketType === 'ORDER')
    const typeLabel = $derived(isOrder ? 'PEDIDO' : 'TICKET DE VENTA')
    const displayNumber = $derived(
        sale.ticketType === 'SALE' && sale.saleNumber ? sale.saleNumber : sale.ticketNumber
    )
</script>

{#snippet metaRow(icon: typeof User, text: string)}
    {@const Icon = icon}
    <div class="flex items-center gap-1.5">
        <Icon size={11} color={INK} strokeWidth={2} />
        <span style="color:{INK};font-size:11px">{text}</span>
    </div>
{/snippet}

<div style="background-color:#ffffff;padding:20px;color:{INK}">
    <!-- Encabezado — empresa -->
    <div style="border-bottom:2px solid {INK};padding-bottom:14px;margin-bottom:14px">
        <p
            style="font-size:17px;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:0.5px;color:{INK}"
        >
            {company?.name || 'Sin nombre de empresa'}
        </p>
        <div class="mt-2 flex flex-col items-center gap-1">
            {#if company?.address}{@render metaRow(MapPin, company.address)}{/if}
            {#if company?.phone_number}{@render metaRow(Phone, company.phone_number)}{/if}
            {#if company?.email}{@render metaRow(Mail, company.email)}{/if}
            {#if company?.document_number}
                <span style="color:{INK};font-size:11px">NIT: {company.document_number}</span>
            {/if}
        </div>
    </div>

    <!-- Datos del ticket -->
    <div class="mb-2 flex items-center justify-between">
        <span style="font-size:14px;font-weight:800;color:{INK}">{typeLabel}</span>
        <span style="font-size:14px;font-weight:800;color:{INK}">{displayNumber}</span>
    </div>
    <div class="mb-3 flex flex-col gap-1">
        {@render metaRow(Receipt, `Fecha: ${formatDate(sale.createdAt)}`)}
        {@render metaRow(User, `Cliente: ${sale.customerName}`)}
        {#if sale.createdBy}{@render metaRow(User, `Vendedor: ${sale.createdBy}`)}{/if}
    </div>

    <div style="border-top:1px dashed {INK};height:0"></div>

    <!-- Tabla de ítems -->
    <div class="mt-3">
        <div
            class="flex items-end pb-1.5"
            style="border-bottom:2px solid {INK}"
        >
            <span style="font-size:10px;font-weight:800;flex:1;color:{INK}">PRODUCTO</span>
            <span style="font-size:10px;font-weight:800;width:30px;text-align:center;color:{INK}"
                >CANT</span
            >
            <span style="font-size:10px;font-weight:800;width:64px;text-align:right;color:{INK}"
                >V.UNIT</span
            >
            <span style="font-size:10px;font-weight:800;width:70px;text-align:right;color:{INK}"
                >V.TOTAL</span
            >
        </div>

        {#each sale.lines as line (line.id)}
            <div
                class="flex items-start py-1.5"
                style={line.note ? '' : `border-bottom:1px solid #d1d5db`}
            >
                <span style="font-size:12px;flex:1;padding-right:6px;color:{INK}">{line.name}</span>
                <span
                    style="font-size:11px;width:30px;text-align:center;font-variant-numeric:tabular-nums;color:{INK}"
                    >{formatNumber(line.quantity)}</span
                >
                <span
                    style="font-size:11px;width:64px;text-align:right;font-variant-numeric:tabular-nums;color:{INK}"
                    >{formatCurrency(line.price)}</span
                >
                <span
                    style="font-size:11px;width:70px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:{INK}"
                    >{formatCurrency(line.total)}</span
                >
            </div>
            {#if line.note}
                <div class="flex items-start gap-1 pb-1.5" style="border-bottom:1px solid #d1d5db">
                    <span style="margin-top:2px"><StickyNote size={11} color={SUB} /></span>
                    <span style="color:{SUB};font-size:11px;font-style:italic;flex:1">{line.note}</span>
                </div>
            {/if}
        {/each}
    </div>

    <!-- Total -->
    <div class="mt-3 pt-3">
        <div style="border-top:1px dashed {INK};height:0"></div>
        <div class="mt-3 flex items-center justify-between">
            <span style="font-size:17px;font-weight:800;color:{INK}">TOTAL:</span>
            <span style="font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;color:{INK}"
                >{formatCurrency(sale.total)}</span
            >
        </div>
    </div>

    <!-- Footer -->
    <div class="mt-5 flex flex-col items-center pt-3.5" style="border-top:2px solid {INK}">
        <span style="font-size:11px;color:{INK}">Gracias por su compra</span>
        <span style="font-size:10px;margin-top:4px;color:{SUB}">
            *** Documento no válido como factura ***
        </span>
    </div>
</div>
