<script lang="ts">
    import { CalendarClock, CircleDollarSign, Layers, TrendingUp } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { FixedExpensesSummaryData } from '../../hooks/useFixedExpensesSummary.svelte'

    interface Props {
        summary: FixedExpensesSummaryData
    }
    let { summary }: Props = $props()

    /** Formatea el tiempo restante hasta el próximo corte de forma compacta. */
    const formatNextPeriod = (date: Date | null): string => {
        if (!date) return 'Sin gastos activos'
        const diffMs = date.getTime() - Date.now()
        if (diffMs <= 0) return 'En este momento'
        const totalMinutes = Math.floor(diffMs / 60_000)
        const days = Math.floor(totalMinutes / (60 * 24))
        const hours = Math.floor((totalMinutes - days * 60 * 24) / 60)
        if (days > 0) return hours > 0 ? `En ${days} d · ${hours} h` : `En ${days} d`
        if (hours > 0) return `En ${hours} h`
        return `En ${totalMinutes} m`
    }

    interface Kpi {
        label: string
        value: string
        icon: IconComponent
        /** Gradiente de overlay radial (color premium por KPI). */
        overlay: string
        fg: string
    }

    const cards = $derived<Kpi[]>([
        {
            label: 'Acumulado en curso',
            value: formatCurrency(summary.accruedToday, 0),
            icon: CircleDollarSign,
            overlay:
                'radial-gradient(120% 120% at 0% 0%, hsla(258,90%,66%,0.18), transparent 60%)',
            fg: 'hsl(258, 90%, 58%)'
        },
        {
            label: 'Proyección mensual',
            value: formatCurrency(summary.monthlyProjection, 0),
            icon: TrendingUp,
            overlay: 'radial-gradient(120% 120% at 0% 0%, hsla(340,82%,62%,0.18), transparent 60%)',
            fg: 'hsl(340, 82%, 56%)'
        },
        {
            label: 'Gastos activos',
            value: String(summary.activeCount),
            icon: Layers,
            overlay: 'radial-gradient(120% 120% at 0% 0%, hsla(158,64%,42%,0.18), transparent 60%)',
            fg: 'hsl(158, 64%, 38%)'
        },
        {
            label: 'Próximo corte',
            value: formatNextPeriod(summary.nextPeriodEnd),
            icon: CalendarClock,
            overlay: 'radial-gradient(120% 120% at 0% 0%, hsla(38,92%,52%,0.20), transparent 60%)',
            fg: 'hsl(32, 95%, 44%)'
        }
    ])
</script>

<div class="grid grid-cols-2 gap-3">
    {#each cards as kpi (kpi.label)}
        {@const Icon = kpi.icon}
        <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card p-4"
            style="box-shadow:0 6px 14px hsla(222,47%,11%,0.05)"
        >
            <div class="pointer-events-none absolute inset-0" style="background:{kpi.overlay}"></div>
            <div class="relative flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <p
                        class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        {kpi.label}
                    </p>
                    <p
                        class="mt-1.5 truncate text-lg font-bold tabular-nums text-foreground"
                        title={kpi.value}
                    >
                        {kpi.value}
                    </p>
                </div>
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style="background-color:hsla(0,0%,100%,0.65);backdrop-filter:blur(4px)"
                >
                    <Icon size={16} color={kpi.fg} strokeWidth={2} />
                </div>
            </div>
        </div>
    {/each}
</div>
