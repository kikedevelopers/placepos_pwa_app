<script lang="ts">
    import {
        ArrowDownRight,
        ArrowUpRight,
        CircleCheck,
        CircleSlash,
        PackagePlus,
        TriangleAlert,
        Truck
    } from '@lucide/svelte'
    import { purchaseViewer } from '$lib/components/PurchaseViewer'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { PurchaseCreatedCard, PurchasePreviewCard } from '$lib/modules/Place/lib/cards'
    import {
        costChange,
        describeIva,
        describePackaging,
        purchasePreviewState,
        type PurchasePreviewState
    } from '$lib/modules/Place/lib/purchase-cards'

    /**
     * Compra a proveedor que Place armó desde una factura (foto o PDF),
     * dibujada con los datos EXACTOS del servidor (evento `card`): lo que el
     * usuario confirma con su "sí" es lo que se crea.
     */
    let { card }: { card: PurchasePreviewCard | PurchaseCreatedCard } = $props()

    const STATUS: Record<PurchasePreviewState, { label: string; tone: string }> = {
        pending: { label: 'Esperando tu "sí"', tone: 'place-pill-pending' },
        expired: { label: 'Vencida', tone: 'place-pill-muted' },
        superseded: { label: 'Reemplazada', tone: 'place-pill-muted' },
        confirmed: { label: 'Compra creada', tone: 'place-pill-ok' }
    }

    // Reloj de minuto: la vista previa vence con el chat abierto.
    let now = $state(Date.now())
    $effect(() => {
        const id = setInterval(() => (now = Date.now()), 60_000)
        return () => clearInterval(id)
    })

    const preview_state = $derived(card.kind === 'purchase_preview' ? purchasePreviewState(card, now) : null)
</script>

{#if card.kind === 'purchase_preview'}
    {@const status = STATUS[preview_state ?? 'pending']}
    <section
        aria-label="Vista previa de la compra"
        class="w-full overflow-hidden rounded-[18px] rounded-tl-[6px] border border-border/70 bg-card"
        class:opacity-55={preview_state === 'superseded' || preview_state === 'expired'}
        style="box-shadow:0 8px 28px -18px rgba(15,23,42,0.45)"
    >
        <header class="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
            <div class="flex items-center gap-2">
                <span class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PackagePlus class="size-3.5" />
                </span>
                <div class="leading-tight">
                    <p class="text-[13px] font-semibold">Vista previa de la compra</p>
                    <p class="text-[11px] text-muted-foreground">
                        {card.invoice_reference ? `Factura ${card.invoice_reference}` : 'Compra a proveedor'}
                    </p>
                </div>
            </div>
            <span class="shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-medium {status.tone}">
                {status.label}
            </span>
        </header>

        <div class="flex min-w-0 items-center gap-1.5 px-3.5 pt-2.5 text-[12.5px]">
            <Truck class="size-3.5 shrink-0 text-muted-foreground" />
            <span class="text-muted-foreground">Proveedor</span>
            <span class="truncate font-medium">{card.supplier.name}</span>
            {#if card.supplier.document}
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">· {card.supplier.document}</span>
            {/if}
        </div>

        <ul class="px-3.5 pt-1">
            {#each card.lines as line, index (index)}
                {@const change = costChange(line)}
                {@const packaging = describePackaging(line)}
                <li class="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0">
                    <div class="min-w-0">
                        <p class="text-[13px] font-medium leading-snug">
                            {line.product_name}
                            {#if line.sku_code}
                                <span class="ml-1 text-[10.5px] font-normal tabular-nums text-muted-foreground"
                                    >{line.sku_code}</span
                                >
                            {/if}
                        </p>
                        {#if line.source_description}
                            <p class="truncate text-[10.5px] italic text-muted-foreground/80" title={line.source_description}>
                                «{line.source_description}»
                            </p>
                        {/if}
                        <p class="text-[11px] tabular-nums text-muted-foreground">
                            {formatNumber(line.quantity, 4)} × {formatCurrency(line.unit_cost)}{packaging
                                ? ` · ${packaging}`
                                : ''} · {describeIva(line.iva_rate)}
                        </p>
                        {#if change && line.last_cost !== null}
                            <p
                                class="flex items-center gap-0.5 text-[10.5px] tabular-nums {change.direction === 'up'
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'}"
                            >
                                {#if change.direction === 'up'}<ArrowUpRight class="size-3" />{:else}<ArrowDownRight
                                        class="size-3"
                                    />{/if}
                                Último costo {formatCurrency(line.last_cost)}{change.percent !== null
                                    ? ` (${change.percent > 0 ? '+' : ''}${formatNumber(change.percent, 1)}%)`
                                    : ''}
                            </p>
                        {/if}
                    </div>
                    <span class="shrink-0 text-[13px] font-medium tabular-nums">{formatCurrency(line.total)}</span>
                </li>
            {/each}
        </ul>

        <dl class="mx-3.5 space-y-0.5 border-t border-border/60 py-2.5 text-[12px]">
            <div class="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd class="tabular-nums">{formatCurrency(card.subtotal)}</dd>
            </div>
            <div class="flex justify-between text-muted-foreground">
                <dt>IVA</dt>
                <dd class="tabular-nums">{formatCurrency(card.iva_total)}</dd>
            </div>
            <div class="flex items-baseline justify-between pt-1">
                <dt class="text-muted-foreground">
                    {card.lines.length}
                    {card.lines.length === 1 ? 'producto' : 'productos'}
                </dt>
                <dd class="text-[17px] font-semibold tabular-nums">{formatCurrency(card.total)}</dd>
            </div>
        </dl>

        {#if card.excluded.length > 0}
            <div class="mx-3.5 mb-2.5 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-2">
                <p class="mb-1 flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                    <CircleSlash class="size-3" />No incluidos ({card.excluded.length})
                </p>
                <ul class="space-y-1">
                    {#each card.excluded as item, index (index)}
                        <li class="text-[11.5px] leading-snug">
                            <span class="font-medium">{item.description}</span>
                            {#if item.reason}<span class="text-muted-foreground"> — {item.reason}</span>{/if}
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}

        {#if card.warnings.length > 0}
            <ul
                class="mx-3.5 mb-2.5 space-y-1 rounded-lg border border-amber-500/25 px-2.5 py-2"
                style="background:rgba(245,158,11,0.06)"
            >
                {#each card.warnings as warning, index (index)}
                    <li class="flex items-start gap-1.5 text-[11.5px] leading-snug text-amber-700">
                        <TriangleAlert class="mt-0.5 size-3 shrink-0" />
                        {warning}
                    </li>
                {/each}
            </ul>
        {/if}

        {#if preview_state === 'pending'}
            <footer class="border-t border-border/60 bg-muted/30 px-3.5 py-2 text-[11.5px] text-muted-foreground">
                Responde <span class="font-semibold text-foreground">«sí»</span> para crearla. Queda pendiente por
                recibir en Compras.
            </footer>
        {:else if preview_state === 'expired'}
            <footer class="border-t border-border/60 bg-muted/30 px-3.5 py-2 text-[11.5px] text-muted-foreground">
                Esta vista previa venció. Pídele a Place que la arme de nuevo.
            </footer>
        {/if}
    </section>
{:else}
    <section
        aria-label="Compra creada"
        class="flex w-full items-center gap-3 rounded-[18px] rounded-tl-[6px] border border-emerald-500/25 px-3.5 py-2.5"
        style="background:rgba(16,185,129,0.06)"
    >
        <CircleCheck class="size-5 shrink-0 text-emerald-500" />
        <div class="min-w-0 flex-1 leading-tight">
            <p class="text-[13px] font-semibold">Compra {card.purchase_number} creada</p>
            <p class="truncate text-[11.5px] text-muted-foreground">
                {card.supplier_name} · {card.lines_count}
                {card.lines_count === 1 ? 'producto' : 'productos'} · pendiente por recibir
            </p>
            <button
                type="button"
                onclick={() => card.kind === 'purchase_created' && purchaseViewer.open(card.purchase_id)}
                class="mt-1 text-[11.5px] font-medium text-primary underline decoration-primary/40 underline-offset-2 active:opacity-70"
            >
                Ver compra
            </button>
        </div>
        <span class="text-[15px] font-semibold tabular-nums">{formatCurrency(card.total)}</span>
    </section>
{/if}

<style>
    .place-pill-pending {
        border-color: hsl(var(--primary) / 0.3);
        background: hsl(var(--primary) / 0.08);
        color: hsl(var(--primary));
    }
    .place-pill-muted {
        border-color: hsl(var(--border));
        background: hsl(var(--muted));
        color: hsl(var(--muted-foreground));
    }
    .place-pill-ok {
        border-color: rgba(16, 185, 129, 0.3);
        background: rgba(16, 185, 129, 0.08);
        color: rgb(5, 150, 105);
    }
</style>
