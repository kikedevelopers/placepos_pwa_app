<script lang="ts">
    import {
        AlertTriangle,
        Archive,
        CalendarClock,
        Pencil,
        Wallet
    } from '@lucide/svelte'
    import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
    import { formatCurrency } from '$lib/utils/numbers'
    import { labelForPeriod } from '$lib/modules/Expenses/constants/periodicity'
    import {
        computeAccrual,
        ratePerDay,
        ratePerHour
    } from '$lib/modules/Expenses/utils/accrual'

    interface Props {
        expense: FixedExpense
        /** Marca de tiempo del useLiveTick: redibuja el devengo en vivo. */
        now: Date
        /** Si el usuario puede gestionar (owner|manager): muestra acciones. */
        canManage: boolean
        onEdit: (expense: FixedExpense) => void
        onArchive: (expense: FixedExpense) => void
        archiving?: boolean
    }
    let { expense, now, canManage, onEdit, onArchive, archiving = false }: Props = $props()

    // Devengo recalculado en cada tick con Big.js (vía las utils del accrual).
    const snapshot = $derived(computeAccrual(expense, now))
    const perDay = $derived(Number(ratePerDay(expense).toFixed(2)))
    const perHour = $derived(Number(ratePerHour(expense).toFixed(2)))

    const progressPct = $derived(
        Math.min(100, Math.max(0, snapshot.currentPeriodProgress * 100))
    )
    const accruedNow = $derived(Number(snapshot.accruedInCurrentPeriod.toFixed(2)))

    /** Tiempo restante hasta el próximo corte, formato compacto es-CO. */
    const remaining = $derived.by(() => {
        const diffMs = snapshot.currentPeriodEnd.getTime() - now.getTime()
        if (diffMs <= 0) return 'Se cumple en este instante'
        const totalMinutes = Math.floor(diffMs / 60_000)
        const days = Math.floor(totalMinutes / (60 * 24))
        const hours = Math.floor((totalMinutes - days * 60 * 24) / 60)
        const minutes = totalMinutes - days * 60 * 24 - hours * 60
        if (days > 0) return hours > 0 ? `Faltan ${days} d · ${hours} h` : `Faltan ${days} d`
        if (hours > 0) return minutes > 0 ? `Faltan ${hours} h · ${minutes} m` : `Faltan ${hours} h`
        if (minutes > 0) return `Faltan ${minutes} m`
        return 'Menos de un minuto'
    })

    const startLabel = $derived(
        new Date(expense.start_date).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    )
</script>

<article
    class="relative overflow-hidden rounded-2xl border border-border bg-card"
    style="box-shadow:0 8px 20px hsla(258,80%,40%,0.07)"
>
    <!-- Accent bar lateral violet -> rose -->
    <div
        class="pointer-events-none absolute inset-y-0 left-0 w-1.5"
        style="background:linear-gradient(to bottom, hsl(258,90%,62%), hsl(290,80%,60%), hsl(340,82%,60%))"
    ></div>

    <div class="space-y-4 p-4 pl-5">
        <!-- Header: icono + nombre + periodicidad + monto -->
        <header class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
                <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style="background-color:hsla(258,90%,62%,0.12)"
                >
                    <Wallet size={20} color="hsl(258, 90%, 58%)" strokeWidth={2} />
                </div>
                <div class="min-w-0">
                    <h3 class="truncate text-base font-bold text-foreground">{expense.name}</h3>
                    {#if expense.description}
                        <p class="mt-0.5 truncate text-xs text-muted-foreground">
                            {expense.description}
                        </p>
                    {/if}
                    <div
                        class="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style="background-color:hsla(258,90%,62%,0.10);color:hsl(258,70%,48%)"
                    >
                        <CalendarClock size={12} color="hsl(258, 70%, 50%)" strokeWidth={2.2} />
                        {labelForPeriod(expense.period_quantity, expense.period_unit)}
                    </div>
                </div>
            </div>
            <div class="shrink-0 text-right">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Monto del periodo
                </p>
                <p class="text-lg font-bold tabular-nums text-foreground">
                    {formatCurrency(expense.amount, 0)}
                </p>
            </div>
        </header>

        <!-- Acumulado del periodo: devengo en tiempo real con barra animada -->
        <div
            class="rounded-2xl p-4"
            style="background:linear-gradient(135deg, hsla(258,90%,62%,0.08), hsla(0,0%,100%,0) 45%, hsla(340,82%,60%,0.08))"
        >
            <div class="flex items-baseline justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Acumulado del periodo
                    </p>
                    <p class="mt-1 truncate text-2xl font-bold tabular-nums text-foreground">
                        {formatCurrency(accruedNow, 0)}
                    </p>
                </div>
                <div class="shrink-0 text-right">
                    <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Progreso</p>
                    <p class="mt-1 text-base font-bold tabular-nums text-foreground">
                        {progressPct.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div
                class="mt-3 h-2.5 overflow-hidden rounded-full"
                style="background-color:hsla(258,30%,80%,0.30)"
            >
                <div
                    class="h-full rounded-full transition-[width] duration-700 ease-out"
                    style="width:{progressPct}%;background:linear-gradient(to right, hsl(258,90%,62%), hsl(340,82%,60%))"
                ></div>
            </div>
            <p class="mt-2 text-[11px] text-muted-foreground">{remaining} para el próximo corte</p>
        </div>

        <!-- Alerta de cortes pendientes (amber) -->
        {#if expense.pending_periods_count > 0}
            <div
                class="rounded-xl p-3"
                style="background-color:hsla(38,92%,50%,0.10);border:1px solid hsla(38,92%,50%,0.30)"
            >
                <div class="flex items-start gap-2">
                    <AlertTriangle size={16} color="hsl(32, 95%, 44%)" strokeWidth={2} />
                    <div class="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                        <p class="text-xs font-semibold" style="color:hsl(28, 80%, 36%)">
                            {expense.pending_periods_count === 1
                                ? '1 corte pendiente'
                                : `${expense.pending_periods_count} cortes pendientes`}
                        </p>
                        <p
                            class="text-sm font-bold tabular-nums"
                            style="color:hsl(28, 80%, 36%)"
                        >
                            {formatCurrency(expense.pending_periods_total, 0)}
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Tasas por día / por hora -->
        <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-border p-3" style="background-color:hsla(0,0%,100%,0.4)">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Por día</p>
                <p class="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(perDay, 0)}
                </p>
            </div>
            <div class="rounded-xl border border-border p-3" style="background-color:hsla(0,0%,100%,0.4)">
                <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Por hora</p>
                <p class="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(perHour, 2)}
                </p>
            </div>
        </div>

        <!-- Footer: activo desde + acciones (solo owner|manager) -->
        <footer class="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
            <p class="text-[11px] text-muted-foreground">Activo desde {startLabel}</p>
            {#if canManage}
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        onclick={() => onEdit(expense)}
                        class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors active:bg-secondary"
                    >
                        <Pencil size={14} color="hsl(215, 16%, 47%)" strokeWidth={2} />
                        Editar
                    </button>
                    <button
                        type="button"
                        onclick={() => onArchive(expense)}
                        disabled={archiving}
                        class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors active:bg-secondary disabled:opacity-50"
                    >
                        <Archive size={14} color="hsl(215, 16%, 47%)" strokeWidth={2} />
                        Archivar
                    </button>
                </div>
            {/if}
        </footer>
    </div>
</article>
