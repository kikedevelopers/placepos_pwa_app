<script lang="ts">
    import { cn } from '$lib/utils'
    import { clampShare } from '$lib/modules/Home/pages/Dashboard/utils/dashboardMath'

    interface Props {
        // Fracción 0..1.
        value: number
        ariaLabel: string
        class?: string
        fillClass?: string
        // Fracción 0..1 donde se dibuja la marca de referencia (ritmo esperado).
        marker?: number
        // Texto real para lectores (p. ej. "130.0%"): aria-valuenow se topa en 100.
        valueText?: string
    }
    let {
        value,
        ariaLabel,
        class: className = '',
        fillClass = 'bg-primary',
        marker,
        valueText
    }: Props = $props()

    const fill = $derived(clampShare(value))
</script>

<!--
    El relleno escala en X desde 0 al montarse (`.dash-bar-fill` +
    @starting-style en app.css): dice "esto se acaba de medir". Con movimiento
    reducido aparece directo.
-->
<div
    role="progressbar"
    aria-label={ariaLabel}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(fill * 100)}
    aria-valuetext={valueText}
    class={cn('relative h-2 w-full rounded-full bg-muted', className)}
>
    <div class="absolute inset-0 overflow-hidden rounded-full">
        <div class={cn('dash-bar-fill h-full w-full', fillClass)} style="--fill:{fill}"></div>
    </div>
    {#if marker !== undefined}
        <span
            aria-hidden="true"
            class="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
            style="left:{clampShare(marker) * 100}%"
        ></span>
    {/if}
</div>
