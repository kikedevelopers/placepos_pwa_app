<script lang="ts">
    import { ArrowDownLeft, ArrowUpRight } from '@lucide/svelte'
    import type { Component } from 'svelte'
    import type { IconComponent } from '$lib/types/icon'
    import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
    import { formatCurrency } from '$lib/utils/numbers'
    import { isPositiveMovement } from '../constants/concepts'

    interface Props {
        name: string
        /** Etiqueta bajo el nombre ("Billetera" o "Ahorro · 0012345678"). */
        subtitle: string
        subtitleMono?: boolean
        subtitleIcon?: IconComponent
        balance: number
        movements: FinancialMovement[]
        icon: IconComponent
        /** Insignia opcional a la derecha (ej. "POS activo"). */
        badge?: string | null
    }
    let {
        name,
        subtitle,
        subtitleMono = false,
        subtitleIcon,
        balance,
        movements,
        icon: Icon,
        badge = null
    }: Props = $props()

    const SubtitleIcon = $derived(subtitleIcon as Component | undefined)

    const totalIncome = $derived(
        movements
            .filter((m) => isPositiveMovement(m.movement_type))
            .reduce((sum, m) => sum + m.amount, 0)
    )
    const totalExpense = $derived(
        movements
            .filter((m) => !isPositiveMovement(m.movement_type))
            .reduce((sum, m) => sum + m.amount, 0)
    )
</script>

<div class="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
    <div
        class="pointer-events-none absolute inset-0"
        style="background:radial-gradient(120% 120% at 100% 0%, hsla(217,91%,50%,0.14), transparent 58%)"
        aria-hidden="true"
    ></div>

    <div class="absolute right-4 top-4">
        <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color:hsla(217,91%,50%,0.15)"
        >
            <Icon size={20} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </div>
    </div>

    <div class="relative space-y-4">
        <div>
            <p class="text-base font-semibold text-foreground">{name}</p>
            <div class="mt-1 flex items-center gap-1.5">
                {#if SubtitleIcon}
                    <SubtitleIcon size={13} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                {/if}
                <span
                    class="text-xs text-muted-foreground {subtitleMono ? 'font-mono' : ''}"
                    >{subtitle}</span
                >
            </div>
        </div>

        <div>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Saldo disponible
            </p>
            <p class="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {formatCurrency(balance)}
            </p>
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
            <div class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15">
                    <ArrowDownLeft size={14} color="hsl(158, 64%, 42%)" strokeWidth={2.2} />
                </span>
                <div>
                    <p class="text-[10px] text-muted-foreground">Ingresos</p>
                    <p class="text-xs font-semibold tabular-nums text-success">
                        {totalIncome > 0 ? formatCurrency(totalIncome) : '—'}
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15">
                    <ArrowUpRight size={14} color="hsl(0, 84%, 55%)" strokeWidth={2.2} />
                </span>
                <div>
                    <p class="text-[10px] text-muted-foreground">Egresos</p>
                    <p class="text-xs font-semibold tabular-nums text-destructive">
                        {totalExpense > 0 ? formatCurrency(totalExpense) : '—'}
                    </p>
                </div>
            </div>
            {#if badge}
                <span
                    class="ml-auto inline-flex items-center rounded-full border border-success/25 bg-success/15 px-2.5 py-1 text-[10px] font-semibold text-success"
                >
                    {badge}
                </span>
            {/if}
        </div>
    </div>
</div>
