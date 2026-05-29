<script lang="ts">
    import { AlertTriangle, CheckCircle2, Target } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import Spinner from '$lib/components/Spinner.svelte'
    import { useBreakEvenProgress } from '../hooks/useBreakEvenProgress.svelte'
    import DailyQuota from './DailyQuota.svelte'
    import { TONE_FILL, TONE_TEXT } from './goalTones'

    const CARD = 'rounded-2xl border border-border bg-card p-5'
    const SHADOW = 'box-shadow:0 8px 14px hsla(222,47%,11%,0.05)'

    const goal = useBreakEvenProgress()

    const widthPct = $derived(
        goal.derived ? Math.min(100, Math.max(0, goal.derived.progressPct)) : 0
    )
</script>

{#if goal.isLoading}
    <div class="{CARD} flex min-h-[140px] items-center justify-center" style={SHADOW}>
        <Spinner />
    </div>
{:else if goal.isError}
    <div class="{CARD} flex items-center gap-3" style={SHADOW}>
        <AlertTriangle size={18} color="hsl(32, 95%, 44%)" strokeWidth={2} />
        <p class="flex-1 text-xs leading-4 text-muted-foreground">
            {getErrorMessage(goal.error) ?? 'No se pudo cargar la meta del mes.'}
        </p>
    </div>
{:else if !goal.data || !goal.data.configured || !goal.derived}
    <div class="{CARD} flex items-start gap-3" style={SHADOW}>
        <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color: hsla(217, 91%, 50%, 0.12)"
        >
            <Target size={20} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </div>
        <div class="flex-1">
            <p class="text-sm font-semibold text-foreground">Punto de equilibrio sin configurar</p>
            <p class="mt-0.5 text-xs leading-4 text-muted-foreground">
                Configura tu punto de equilibrio en placepos para ver el progreso del mes.
            </p>
        </div>
    </div>
{:else}
    {@const data = goal.data}
    {@const derived = goal.derived}
    <div class={CARD} style={SHADOW}>
        <div class="mb-5 flex items-center gap-2.5">
            <div
                class="flex h-9 w-9 items-center justify-center rounded-xl"
                style="background-color: hsla(217, 91%, 50%, 0.15)"
            >
                <Target size={16} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </div>
            <div>
                <p class="text-sm font-semibold text-foreground">Meta del mes</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{derived.monthRange}</p>
            </div>
        </div>

        <div class="mb-3 flex items-end justify-between gap-3">
            <div class="flex flex-1 items-baseline gap-2">
                <span class="truncate text-2xl font-bold text-foreground"
                    >{formatCurrency(data.monthRealProfit)}</span
                >
                <span class="truncate text-xs text-muted-foreground"
                    >de {formatCurrency(data.breakEvenAmount)}</span
                >
            </div>
            <span class="text-lg font-bold {TONE_TEXT[derived.tone]}">{derived.progressLabel}</span>
        </div>

        <div class="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
                class="h-full rounded-full transition-[width] duration-500 ease-out-strong"
                style="width:{widthPct}%;background-color:{TONE_FILL[derived.tone]}"
            ></div>
        </div>

        {#if derived.isReached}
            <div
                class="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
                style="background-color:hsla(158,64%,38%,0.10);border:1px solid hsla(158,64%,38%,0.30)"
            >
                <CheckCircle2 size={16} color="hsl(158, 64%, 38%)" strokeWidth={2} />
                <span class="flex-1 text-xs font-semibold text-success">
                    Meta superada · Excedente {formatCurrency(derived.surplus)}
                </span>
            </div>
        {:else}
            <p class="mt-3 text-xs text-muted-foreground">
                Faltan <span class="font-semibold text-foreground"
                    >{formatCurrency(derived.deficit)}</span
                > para alcanzar la meta del mes.
            </p>
        {/if}

        <DailyQuota
            dailyTarget={data.dailyTarget}
            dayRealProfit={data.dayRealProfit}
            tone={derived.dayTone}
            progressPct={derived.dayProgressPct}
            deficit={derived.dayDeficit}
            surplus={derived.daySurplus}
            isReached={derived.dayIsReached}
        />
    </div>
{/if}
