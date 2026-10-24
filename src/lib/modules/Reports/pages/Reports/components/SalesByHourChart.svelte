<script lang="ts">
    import type { SalesByHourEntry } from '$lib/api/requests/reports/types'
    import { Money, Skeleton, areaPath, fullHour, linePath, nearestIndex, niceMax, plural, seriesPoints, shortHour, shortMoney } from '$lib/components/premium'

    /**
     * Venta por horas (espejo de "Venta por horas" de placepos). Área con
     * degradado + línea; se recorre con el dedo (cursor que sigue 1:1 al toque)
     * y la cabecera muestra la hora tocada. Sin tocar, muestra la hora pico.
     */
    interface Props {
        hours: SalesByHourEntry[]
        loading?: boolean
    }
    let { hours, loading = false }: Props = $props()

    const W = 320
    const H = 132
    let active = $state<number | null>(null)
    let svgEl = $state<SVGSVGElement | null>(null)

    const values = $derived(hours.map((h) => h.total))
    const max = $derived(niceMax(Math.max(0, ...values)))
    const points = $derived(seriesPoints(values, W, H, max))
    const peak = $derived(
        hours.reduce<SalesByHourEntry | null>((best, h) => (h.total > (best?.total ?? 0) ? h : best), null)
    )
    const shown = $derived(active != null ? hours[active] : peak)

    const track = (e: PointerEvent) => {
        if (!svgEl || hours.length === 0) return
        const rect = svgEl.getBoundingClientRect()
        active = nearestIndex(((e.clientX - rect.left) / rect.width) * W, W, hours.length)
    }
</script>

<div class="surface overflow-hidden px-5 pb-4 pt-[18px]">
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <p class="text-[13px] font-medium text-muted-foreground">
                {#if active != null && shown}{fullHour(shown.hour)}{:else}Venta por horas{/if}
            </p>
            <p class="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-foreground">
                {#if loading}
                    <Skeleton class="h-7 w-32" />
                {:else if shown && shown.total > 0}
                    <Money value={shown.total} />
                {:else}
                    <span class="text-muted-foreground">Sin ventas</span>
                {/if}
            </p>
            <p class="mt-0.5 text-[12px] text-muted-foreground">
                {#if active != null && shown}
                    {plural(shown.count, 'venta')}
                {:else if peak}
                    Hora pico · {fullHour(peak.hour)}
                {:else}
                    Toca la gráfica para ver cada hora
                {/if}
            </p>
        </div>
        {#if peak}
            <span class="shrink-0 pt-0.5 text-[11.5px] tabular-nums text-muted-foreground">máx {shortMoney(max)}</span>
        {/if}
    </div>

    <svg
        bind:this={svgEl}
        viewBox="0 0 {W} {H + 18}"
        class="mt-4 w-full touch-none select-none overflow-visible"
        role="img"
        aria-label="Gráfica de venta por horas"
        onpointerdown={(e) => {
            ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
            track(e)
        }}
        onpointermove={(e) => {
            if (e.buttons > 0 || e.pointerType !== 'mouse' || active != null) track(e)
        }}
        onpointerup={() => (active = null)}
        onpointercancel={() => (active = null)}
        onpointerleave={() => (active = null)}
    >
        <defs>
            <linearGradient id="sbh-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="hsl(var(--primary))" stop-opacity="0.22" />
                <stop offset="100%" stop-color="hsl(var(--primary))" stop-opacity="0" />
            </linearGradient>
        </defs>
        {#each [0.5, 1] as f (f)}
            <line x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="hsl(var(--border))" stroke-dasharray="2 4" stroke-width="1" />
        {/each}
        <line x1="0" x2={W} y1={H} y2={H} stroke="hsl(var(--border))" stroke-width="1" />
        {#if !loading && points.length > 0}
            <path d={areaPath(points, H)} fill="url(#sbh-fill)" />
            <path d={linePath(points)} fill="none" stroke="hsl(var(--primary))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
            {#if active != null}
                <line x1={points[active].x} x2={points[active].x} y1="0" y2={H} stroke="hsl(var(--foreground) / 0.25)" stroke-width="1" />
                <circle cx={points[active].x} cy={points[active].y} r="5" fill="hsl(var(--card))" stroke="hsl(var(--primary))" stroke-width="2.5" />
            {/if}
        {/if}
        {#each hours as h, i (h.hour)}
            {#if h.hour % 3 === 0}
                <text x={points[i]?.x ?? 0} y={H + 14} text-anchor={i === 0 ? 'start' : 'middle'} font-size="10" fill="hsl(var(--muted-foreground))">{shortHour(h.hour)}</text>
            {/if}
        {/each}
    </svg>
</div>
