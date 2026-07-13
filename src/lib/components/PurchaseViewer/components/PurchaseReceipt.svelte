<script lang="ts">
    import { FileText, Mail, MapPin, Phone, ShoppingBag, Truck, User } from '@lucide/svelte'
    import type { CompanyProfile } from '$lib/api/requests/authentication/types'
    import type { PurchaseDetail } from '$lib/api/requests/purchases'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'

    interface Props {
        purchase: PurchaseDetail
        company: CompanyProfile | null
    }
    let { purchase, company }: Props = $props()

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

    <!-- Comprobante de compra -->
    <div class="mb-3 flex flex-col items-center gap-1">
        <span
            class="flex items-center gap-1.5"
            style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:{INK}"
        >
            <ShoppingBag size={13} color={INK} strokeWidth={2.2} /> Comprobante de compra
        </span>
        <span style="font-size:16px;font-weight:800;color:{INK}">{purchase.purchase_number}</span>
        <span style="font-size:11px;color:{SUB}">{formatDate(purchase.created_at)}</span>
    </div>

    <!-- Proveedor -->
    <div style="border:1px solid rgba(17,24,39,0.25);border-radius:8px;padding:12px;margin-bottom:14px">
        <span
            class="flex items-center gap-1.5"
            style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:{SUB}"
        >
            <Truck size={12} color={SUB} strokeWidth={2.2} /> Proveedor
        </span>
        <p style="margin-top:4px;font-size:13px;font-weight:700;color:{INK}">
            {purchase.supplier_name}
        </p>
        {#if purchase.created_by}
            <p style="margin-top:2px;font-size:11px;color:{SUB}">
                Registrado por: {purchase.created_by}
            </p>
        {/if}
    </div>

    <!-- Tabla de ítems -->
    <div>
        <div class="flex items-end pb-1.5" style="border-bottom:2px solid {INK}">
            <span style="font-size:10px;font-weight:800;flex:1;color:{INK}">PRODUCTO</span>
            <span style="font-size:10px;font-weight:800;width:44px;text-align:right;color:{INK}"
                >CANT.</span
            >
            <span style="font-size:10px;font-weight:800;width:70px;text-align:right;color:{INK}"
                >PRECIO</span
            >
            <span style="font-size:10px;font-weight:800;width:74px;text-align:right;color:{INK}"
                >TOTAL</span
            >
        </div>

        {#each purchase.lines as line (line.id)}
            <div class="flex items-start py-1.5" style="border-bottom:1px solid #d1d5db">
                <div style="flex:1;padding-right:6px">
                    <p style="font-size:12px;color:{INK}">{line.name}</p>
                    {#if line.iva_rate > 0}
                        <p style="font-size:10px;color:{SUB}">
                            IVA {formatNumber(line.iva_rate)}% — {formatCurrency(line.iva_amount)}
                        </p>
                    {/if}
                </div>
                <span
                    style="font-size:11px;width:44px;text-align:right;font-variant-numeric:tabular-nums;color:{INK}"
                    >{formatNumber(line.packaging_qty, 2)}</span
                >
                <span
                    style="font-size:11px;width:70px;text-align:right;font-variant-numeric:tabular-nums;color:{INK}"
                    >{formatCurrency(line.packaging_price)}</span
                >
                <span
                    style="font-size:11px;width:74px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:{INK}"
                    >{formatCurrency(line.total)}</span
                >
            </div>
        {/each}
    </div>

    <!-- Totales -->
    <div class="mt-3 flex flex-col gap-1">
        <div class="flex items-center justify-between">
            <span style="font-size:12px;color:{SUB}">Subtotal</span>
            <span style="font-size:12px;font-variant-numeric:tabular-nums;color:{INK}"
                >{formatCurrency(purchase.subtotal)}</span
            >
        </div>
        <div class="flex items-center justify-between">
            <span style="font-size:12px;color:{SUB}">IVA</span>
            <span style="font-size:12px;font-variant-numeric:tabular-nums;color:{INK}"
                >{formatCurrency(purchase.iva_total)}</span
            >
        </div>
        <div
            class="mt-1 flex items-center justify-between pt-2"
            style="border-top:1px dashed {INK}"
        >
            <span style="font-size:15px;font-weight:800;text-transform:uppercase;color:{INK}"
                >Total</span
            >
            <span
                style="font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;color:{INK}"
                >{formatCurrency(purchase.total)}</span
            >
        </div>
    </div>

    {#if purchase.notes}
        <div class="mt-4 pt-3" style="border-top:1px solid rgba(17,24,39,0.2)">
            <span
                class="flex items-center gap-1.5"
                style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:{SUB}"
            >
                <FileText size={12} color={SUB} strokeWidth={2.2} /> Observaciones
            </span>
            <p style="margin-top:4px;font-size:11px;white-space:pre-line;color:{INK}">
                {purchase.notes}
            </p>
        </div>
    {/if}

    <!-- Footer -->
    <div class="mt-5 flex flex-col items-center pt-3.5" style="border-top:2px solid {INK}">
        <span style="font-size:10px;color:{SUB}">
            *** Documento no válido como factura ***
        </span>
    </div>
</div>
