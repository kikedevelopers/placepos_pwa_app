<script lang="ts">
    import { untrack } from 'svelte'
    import { Percent, Save } from '@lucide/svelte'
    import type { PosMarginsConfig } from '$lib/api/requests/appSettings'
    import { getErrorMessage } from '$lib/utils/errors'
    import NumberField from '$lib/components/NumberField.svelte'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import StatusBanner from '$lib/components/StatusBanner.svelte'
    import { posMarginsSchema, type PosMarginsFormData } from '../schemas/pos'
    import { useUpdatePosMargins } from '../hooks/usePosSettings'

    let { config }: { config: PosMarginsConfig } = $props()

    const update = useUpdatePosMargins()

    const toForm = (c: PosMarginsConfig): PosMarginsFormData => ({
        enabled: c.enabled,
        margin1: typeof c.margins[0] === 'number' ? c.margins[0] : undefined,
        margin2: typeof c.margins[1] === 'number' ? c.margins[1] : undefined,
        margin3: typeof c.margins[2] === 'number' ? c.margins[2] : undefined
    })

    let form = $state<PosMarginsFormData>(untrack(() => toForm(config)))
    let attempted = $state(false)
    let submitError = $state('')
    let saved = $state(false)

    const buildErrors = (issues: { path: (string | number)[]; message: string }[]) => {
        const map: Record<string, string> = {}
        for (const issue of issues) {
            const key = issue.path.join('.')
            if (!(key in map)) map[key] = issue.message
        }
        return map
    }

    const validation = $derived(posMarginsSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error.issues) : {})

    const touch = () => ((submitError = ''), (saved = false))

    const setMargin = (key: 'margin1' | 'margin2' | 'margin3', v: number | null) => {
        form[key] = v ?? undefined
        touch()
    }

    const submit = () => {
        attempted = true
        touch()
        if (!validation.success) return
        const d = validation.data
        const margins = d.enabled
            ? [d.margin1, d.margin2, d.margin3].filter((n): n is number => typeof n === 'number')
            : []
        $update.mutate(
            { enabled: d.enabled, margins },
            {
                onSuccess: (data) => {
                    form = toForm(data)
                    saved = true
                    attempted = false
                },
                onError: (e) =>
                    (submitError = getErrorMessage(e) ?? 'No se pudo guardar la configuración.')
            }
        )
    }
</script>

<div class="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
    <div class="flex items-center gap-3">
        <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style="background-color:hsla(217,91%,50%,0.12)"
        >
            <Percent size={20} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </span>
        <div class="min-w-0 flex-1">
            <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Punto de venta
            </p>
            <p class="text-sm font-bold text-foreground">Validación de márgenes</p>
        </div>
        <div class="shrink-0">
            <ToggleSwitch
                variant="bare"
                checked={form.enabled}
                onChange={(v) => ((form.enabled = v), touch())}
                ariaLabel="Activar validación de márgenes"
            />
        </div>
    </div>

    <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
        Hasta 3 umbrales ascendentes para clasificar el margen de cada venta y bloquear las que
        caigan por debajo del mínimo.
    </p>

    <div
        class="mt-4 grid grid-cols-1 gap-3 transition-opacity duration-200 {form.enabled
            ? ''
            : 'pointer-events-none opacity-50'}"
    >
        <div>
            <NumberField
                value={form.margin1 ?? null}
                onValueChange={(v) => setMargin('margin1', v)}
                label="Mínimo *"
                suffix="%"
                placeholder="0.00"
                step={0.01}
                min={0.01}
                error={errors['margin1']}
            />
            <p class="mt-1 ml-0.5 text-[11px] text-muted-foreground">Piso obligatorio: bloquea la venta</p>
        </div>
        <div>
            <NumberField
                value={form.margin2 ?? null}
                onValueChange={(v) => setMargin('margin2', v)}
                label="Medio (opcional)"
                suffix="%"
                placeholder="0.00"
                step={0.01}
                min={0.01}
                error={errors['margin2']}
            />
            <p class="mt-1 ml-0.5 text-[11px] text-muted-foreground">Aviso: margen ajustado</p>
        </div>
        <div>
            <NumberField
                value={form.margin3 ?? null}
                onValueChange={(v) => setMargin('margin3', v)}
                label="Saludable (opcional)"
                suffix="%"
                placeholder="0.00"
                step={0.01}
                min={0.01}
                error={errors['margin3']}
            />
            <p class="mt-1 ml-0.5 text-[11px] text-muted-foreground">Objetivo: venta óptima</p>
        </div>
    </div>

    <p class="mt-3 text-[11px] text-muted-foreground">Orden ascendente estricto · ej. 10 &lt; 20 &lt; 40</p>

    {#if submitError}
        <div class="mt-3"><StatusBanner kind="error" message={submitError} /></div>
    {:else if saved}
        <div class="mt-3"><StatusBanner kind="success" message="Configuración guardada" /></div>
    {/if}

    <div class="mt-4">
        <PrimaryButton label="Guardar" icon={Save} loading={$update.isPending} onclick={submit} />
    </div>
</div>
