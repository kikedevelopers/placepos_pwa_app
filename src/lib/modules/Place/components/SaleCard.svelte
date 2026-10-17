<script lang="ts">
    import { CircleCheck, ReceiptText, TriangleAlert, User } from '@lucide/svelte'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { AssistantCard, SalePreviewCard } from '$lib/modules/Place/lib/cards'

    /**
     * Factura del pedido que preparó Place, dibujada con los datos EXACTOS del
     * servidor (evento `card`), no con el texto del modelo: lo que el usuario
     * confirma con su "sí" es lo que se crea. Espejo de `SaleCard` de placepos.
     */
    let { card }: { card: AssistantCard } = $props()

    const STATUS: Record<SalePreviewCard['status'], { label: string; tone: string }> = {
        pending: { label: 'Esperando tu "sí"', tone: 'place-pill-pending' },
        superseded: { label: 'Reemplazada', tone: 'place-pill-muted' },
        confirmed: { label: 'Pedido creado', tone: 'place-pill-ok' }
    }
</script>

{#if card.kind === 'sale_preview'}
    {@const status = STATUS[card.status]}
    <section
        aria-label="Vista previa del pedido"
        class="w-full overflow-hidden rounded-[18px] rounded-tl-[6px] border border-border/70 bg-card"
        class:opacity-55={card.status === 'superseded'}
        style="box-shadow:0 8px 28px -18px rgba(15,23,42,0.45)"
    >
        <header class="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
            <div class="flex items-center gap-2">
                <span class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ReceiptText class="size-3.5" />
                </span>
                <div class="leading-tight">
                    <p class="text-[13px] font-semibold">Vista previa del pedido</p>
                    <p class="text-[11px] text-muted-foreground">Pedido por cobrar</p>
                </div>
            </div>
            <span class="rounded-full border px-2 py-0.5 text-[10.5px] font-medium {status.tone}">
                {status.label}
            </span>
        </header>

        <div class="flex items-center gap-1.5 px-3.5 pt-2.5 text-[12.5px]">
            <User class="size-3.5 text-muted-foreground" />
            <span class="text-muted-foreground">Cliente</span>
            <span class="font-medium">{card.customer}</span>
        </div>

        <ul class="px-3.5 pt-1">
            {#each card.lines as line (line.line)}
                <li class="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0">
                    <div class="min-w-0">
                        <p class="text-[13px] font-medium leading-snug">{line.product}</p>
                        <p class="text-[11px] text-muted-foreground tabular-nums">
                            {formatNumber(line.quantity, 4)} × {formatCurrency(line.unit_price)} · {line.price_label}{line.note
                                ? ` · ${line.note}`
                                : ''}
                        </p>
                    </div>
                    <span class="shrink-0 text-[13px] font-medium tabular-nums">{formatCurrency(line.total)}</span>
                </li>
            {/each}
        </ul>

        <div class="mx-3.5 flex items-baseline justify-between border-t border-border/60 py-2.5">
            <span class="text-[12px] text-muted-foreground">
                {card.lines.length}
                {card.lines.length === 1 ? 'producto' : 'productos'}
            </span>
            <span class="text-[17px] font-semibold tabular-nums">{formatCurrency(card.total)}</span>
        </div>

        {#if card.warnings.length > 0}
            <ul class="mx-3.5 mb-2.5 space-y-1 rounded-lg border border-amber-500/25 px-2.5 py-2" style="background:rgba(245,158,11,0.06)">
                {#each card.warnings as warning (warning)}
                    <li class="flex items-start gap-1.5 text-[11.5px] leading-snug text-amber-700">
                        <TriangleAlert class="mt-0.5 size-3 shrink-0" />
                        {warning}
                    </li>
                {/each}
            </ul>
        {/if}

        {#if card.status === 'pending'}
            <footer class="border-t border-border/60 bg-muted/30 px-3.5 py-2 text-[11.5px] text-muted-foreground">
                Responde <span class="font-semibold text-foreground">«sí»</span> para crearlo. Queda en Tickets
                del POS para cobrarlo allí.
            </footer>
        {/if}
    </section>
{:else}
    <section
        aria-label="Pedido creado"
        class="flex w-full items-center gap-3 rounded-[18px] rounded-tl-[6px] border border-emerald-500/25 px-3.5 py-2.5"
        style="background:rgba(16,185,129,0.06)"
    >
        <CircleCheck class="size-5 shrink-0 text-emerald-500" />
        <div class="min-w-0 flex-1 leading-tight">
            <p class="text-[13px] font-semibold">Pedido {card.ticket_number} creado</p>
            <p class="truncate text-[11.5px] text-muted-foreground">
                {card.customer} · {card.lines}
                {card.lines === 1 ? 'producto' : 'productos'} · por cobrar en Tickets del POS
            </p>
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
