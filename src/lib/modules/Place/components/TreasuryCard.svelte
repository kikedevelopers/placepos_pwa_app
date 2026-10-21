<script lang="ts">
    import { ArrowDown, ArrowLeftRight, Banknote, CircleCheck, Landmark, Scale, Wallet } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { TreasuryDoneCard, TreasuryPreviewCard, TreasuryPreviewSide } from '$lib/modules/Place/lib/cards'

    /**
     * Movimiento de saldo que preparó Place (traslado o corrección), dibujado
     * con los datos EXACTOS del servidor (evento `card`), no con el texto del
     * modelo: lo que el usuario confirma con su "sí" es lo que se mueve. Espejo
     * de `TreasuryCard` de placepos.
     */
    let { card }: { card: TreasuryPreviewCard | TreasuryDoneCard } = $props()

    const STATUS: Record<TreasuryPreviewCard['status'], { label: string; tone: string }> = {
        pending: { label: 'Esperando tu "sí"', tone: 'place-pill-pending' },
        superseded: { label: 'Reemplazado', tone: 'place-pill-muted' },
        confirmed: { label: 'Hecho', tone: 'place-pill-ok' }
    }

    const kindIcon = (kind: string) => (kind === 'banco' ? Landmark : kind === 'caja' ? Banknote : Wallet)
</script>

{#snippet side(label: string, account: TreasuryPreviewSide)}
    {@const Icon = kindIcon(account.kind)}
    <div class="flex items-center gap-2.5">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon class="size-4" />
        </span>
        <div class="min-w-0 flex-1 leading-tight">
            <p class="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                {label} · {account.kind}
            </p>
            <p class="truncate text-[13px] font-semibold">{account.name}</p>
        </div>
        <p class="text-right text-[11.5px] leading-tight tabular-nums text-muted-foreground">
            {formatCurrency(account.balance)}
            <span class="block font-medium text-foreground">→ {formatCurrency(account.balance_after)}</span>
        </p>
    </div>
{/snippet}

{#if card.kind === 'treasury_preview'}
    {@const status = STATUS[card.status]}
    {@const HeaderIcon = card.operation === 'transfer' ? ArrowLeftRight : Scale}
    <section
        aria-label={card.operation === 'transfer' ? 'Vista previa del traslado' : 'Vista previa de la corrección'}
        class="w-full overflow-hidden rounded-[18px] rounded-tl-[6px] border border-border/70 bg-card"
        class:opacity-55={card.status === 'superseded'}
        style="box-shadow:0 8px 28px -18px rgba(15,23,42,0.45)"
    >
        <header class="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
            <div class="flex items-center gap-2">
                <span class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HeaderIcon class="size-3.5" />
                </span>
                <div class="leading-tight">
                    <p class="text-[13px] font-semibold">
                        {card.operation === 'transfer' ? 'Mover saldo' : 'Corregir saldo'}
                    </p>
                    <p class="text-[11px] text-muted-foreground">
                        {card.operation === 'transfer' ? 'Traslado entre cuentas' : 'Queda exactamente en el valor final'}
                    </p>
                </div>
            </div>
            <span class="rounded-full border px-2 py-0.5 text-[10.5px] font-medium {status.tone}">
                {status.label}
            </span>
        </header>

        {#if card.operation === 'transfer'}
            <div class="space-y-2 px-3.5 py-2.5">
                {@render side('Desde', card.from)}
                <div class="flex items-center gap-2 pl-[9px]">
                    <ArrowDown class="size-3.5 text-primary" />
                    <span class="text-[17px] font-semibold tabular-nums">{formatCurrency(card.amount)}</span>
                </div>
                {@render side('Hacia', card.to)}
            </div>
        {:else}
            {@const Icon = kindIcon(card.account.kind)}
            <div class="space-y-2.5 px-3.5 py-2.5">
                <div class="flex items-center gap-2.5">
                    <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon class="size-4" />
                    </span>
                    <div class="min-w-0 leading-tight">
                        <p class="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                            {card.account.kind}
                        </p>
                        <p class="truncate text-[13px] font-semibold">{card.account.name}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
                        <p class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Saldo actual</p>
                        <p class="text-[15px] font-semibold tabular-nums">{formatCurrency(card.balance)}</p>
                    </div>
                    <div class="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2">
                        <p class="text-[10px] font-medium uppercase tracking-wide text-primary">Quedará en</p>
                        <p class="text-[15px] font-semibold tabular-nums">{formatCurrency(card.target_balance)}</p>
                    </div>
                </div>
                <p class="text-[12px] tabular-nums {card.difference > 0 ? 'text-emerald-600' : 'text-amber-700'}">
                    {card.difference > 0 ? 'Entrada' : 'Salida'} por ajuste de
                    <span class="font-semibold">{formatCurrency(Math.abs(card.difference))}</span>{card.reason
                        ? ` · ${card.reason}`
                        : ''}
                </p>
            </div>
        {/if}

        {#if card.status === 'pending'}
            <footer class="border-t border-border/60 bg-muted/30 px-3.5 py-2 text-[11.5px] text-muted-foreground">
                Responde <span class="font-semibold text-foreground">«sí»</span> para
                {card.operation === 'transfer' ? 'moverlo' : 'corregirlo'}. Sin tu «sí» no se mueve un peso.
            </footer>
        {/if}
    </section>
{:else}
    <section
        aria-label={card.operation === 'transfer' ? 'Traslado hecho' : 'Corrección hecha'}
        class="flex w-full items-center gap-3 rounded-[18px] rounded-tl-[6px] border border-emerald-500/25 px-3.5 py-2.5"
        style="background:rgba(16,185,129,0.06)"
    >
        <CircleCheck class="size-5 shrink-0 text-emerald-500" />
        <div class="min-w-0 flex-1 leading-tight">
            {#if card.operation === 'transfer'}
                <p class="text-[13px] font-semibold">{formatCurrency(card.amount)} movidos</p>
                <p class="truncate text-[11.5px] tabular-nums text-muted-foreground">
                    {card.from.name}: {formatCurrency(card.from.balance)} · {card.to.name}: {formatCurrency(
                        card.to.balance
                    )}
                </p>
            {:else}
                <p class="truncate text-[13px] font-semibold">
                    {card.account.name} quedó en {formatCurrency(card.balance)}
                </p>
                <p class="text-[11.5px] tabular-nums text-muted-foreground">
                    {card.difference > 0 ? 'Entrada' : 'Salida'} por ajuste de {formatCurrency(Math.abs(card.difference))}
                </p>
            {/if}
        </div>
    </section>
{/if}
