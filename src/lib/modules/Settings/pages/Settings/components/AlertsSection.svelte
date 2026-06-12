<script lang="ts">
    import { Save, UserX } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import NumberField from '$lib/components/NumberField.svelte'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import StatusBanner from '$lib/components/StatusBanner.svelte'
    import SectionHeader from './SectionHeader.svelte'
    import { inactiveCustomerSchema, inactiveCustomerDefaults } from '../schemas/alerts'
    import { useAlertConfig, useUpdateAlertConfig } from '../hooks/useAlertSettings'

    let { onBack }: { onBack: () => void } = $props()

    const query = useAlertConfig('INACTIVE_CUSTOMER')
    const update = useUpdateAlertConfig('INACTIVE_CUSTOMER')

    let form = $state(inactiveCustomerDefaults())
    let seeded = $state(false)
    let attempted = $state(false)
    let submitError = $state('')
    let saved = $state(false)

    const num = (v: unknown, fallback: number) =>
        typeof v === 'number' && Number.isFinite(v) ? v : fallback

    // Siembra desde la config del backend (una sola vez, sin pisar edición).
    $effect(() => {
        const cfg = $query.data
        if (cfg && !seeded) {
            const p = cfg.params ?? {}
            form.is_enabled = cfg.is_enabled
            form.inactivity_days = num(p.inactivity_days, 30)
            form.min_purchases = num(p.min_purchases, 1)
            form.recurrence_window_days = num(p.recurrence_window_days, 60)
            form.check_time = (cfg.check_time ?? '09:00:00').slice(0, 5)
            seeded = true
        }
    })

    const buildErrors = (issues: { path: (string | number)[]; message: string }[]) => {
        const map: Record<string, string> = {}
        for (const issue of issues) {
            const key = issue.path.join('.')
            if (!(key in map)) map[key] = issue.message
        }
        return map
    }

    const validation = $derived(inactiveCustomerSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error.issues) : {})

    const touch = () => ((submitError = ''), (saved = false))

    const submit = () => {
        attempted = true
        touch()
        if (!validation.success) return
        const d = validation.data
        $update.mutate(
            {
                is_enabled: d.is_enabled,
                check_time: `${d.check_time}:00`,
                params: {
                    inactivity_days: d.inactivity_days,
                    min_purchases: d.min_purchases,
                    recurrence_window_days: d.recurrence_window_days
                }
            },
            {
                onSuccess: () => {
                    saved = true
                    attempted = false
                },
                onError: (e) =>
                    (submitError = getErrorMessage(e) ?? 'No se pudo guardar la configuración.')
            }
        )
    }
</script>

<SectionHeader title="Alertas" subtitle="Notificaciones automáticas" {onBack} />

<div class="flex flex-col gap-5 px-5 pb-8">
    <div class="rounded-2xl border border-border bg-card p-4">
        <h2 class="text-sm font-bold text-foreground">Configuración de alertas</h2>
        <p class="mt-0.5 text-[11px] text-muted-foreground">
            Define qué eventos generan notificaciones y cuándo se ejecutan.
        </p>
    </div>

    {#if $query.isLoading}
        <ScreenState kind="loading" />
    {:else if $query.isError}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    {:else}
        <div class="rounded-2xl border border-border bg-card p-4">
            <div class="flex items-center gap-3">
                <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style="background-color:hsla(217,91%,50%,0.12)"
                >
                    <UserX size={20} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </span>
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-foreground">Clientes inactivos</p>
                    <p class="text-[11px] text-muted-foreground">
                        Notifica clientes que no han comprado en un período definido.
                    </p>
                </div>
                <div class="shrink-0">
                    <ToggleSwitch
                        variant="bare"
                        checked={form.is_enabled}
                        onChange={(v) => ((form.is_enabled = v), touch())}
                        ariaLabel="Activar alerta de clientes inactivos"
                    />
                </div>
            </div>

            <div
                class="mt-4 grid grid-cols-1 gap-3 transition-opacity duration-200 {form.is_enabled
                    ? ''
                    : 'pointer-events-none opacity-50'}"
            >
                <NumberField
                    value={form.inactivity_days}
                    onValueChange={(v) => ((form.inactivity_days = v ?? 0), touch())}
                    label="Días sin comprar"
                    integer
                    min={1}
                    error={errors['inactivity_days']}
                />
                <NumberField
                    value={form.min_purchases}
                    onValueChange={(v) => ((form.min_purchases = v ?? 0), touch())}
                    label="Compras mínimas en la ventana"
                    integer
                    min={1}
                    error={errors['min_purchases']}
                />
                <NumberField
                    value={form.recurrence_window_days}
                    onValueChange={(v) => ((form.recurrence_window_days = v ?? 0), touch())}
                    label="Ventana de recurrencia (días)"
                    integer
                    min={1}
                    error={errors['recurrence_window_days']}
                />
                <div>
                    <label
                        for="alert-check-time"
                        class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
                        >Hora del chequeo</label
                    >
                    <div
                        class="flex h-[52px] items-center rounded-[14px] px-3.5"
                        style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
                    >
                        <input
                            id="alert-check-time"
                            type="time"
                            bind:value={form.check_time}
                            oninput={touch}
                            class="w-full bg-transparent text-base text-foreground outline-none"
                        />
                    </div>
                    {#if errors['check_time']}
                        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{errors['check_time']}</p>
                    {/if}
                </div>
            </div>

            {#if submitError}
                <div class="mt-3"><StatusBanner kind="error" message={submitError} /></div>
            {:else if saved}
                <div class="mt-3"><StatusBanner kind="success" message="Configuración guardada" /></div>
            {/if}

            <div class="mt-4">
                <PrimaryButton
                    label="Guardar"
                    icon={Save}
                    loading={$update.isPending}
                    onclick={submit}
                />
            </div>
        </div>
    {/if}
</div>
