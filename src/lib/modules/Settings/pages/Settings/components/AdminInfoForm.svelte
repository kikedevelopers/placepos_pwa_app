<script lang="ts">
    import { untrack } from 'svelte'
    import { Save, Target } from '@lucide/svelte'
    import type { Company } from '$lib/api/requests/company'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import RangeSlider from '$lib/components/RangeSlider.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import StatusBanner from '$lib/components/StatusBanner.svelte'
    import { adminInfoSchema } from '../schemas/business'
    import { useUpdateCompany } from '../hooks/useCompanySettings'

    let { company }: { company: Company } = $props()

    const update = useUpdateCompany()

    let amount = $state<number | null>(untrack(() => company.break_even_amount ?? 0))
    let periodDays = $state<number>(untrack(() => company.break_even_period_days ?? 30))
    let seededId = $state(untrack(() => company.id))
    let attempted = $state(false)
    let submitError = $state('')
    let saved = $state(false)

    $effect(() => {
        if (company.id !== seededId) {
            amount = company.break_even_amount ?? 0
            periodDays = company.break_even_period_days ?? 30
            seededId = company.id
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

    const validation = $derived(
        adminInfoSchema.safeParse({
            break_even_amount: amount,
            break_even_period_days: periodDays
        })
    )
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error.issues) : {})
    const dirty = $derived(
        (amount ?? 0) !== (company.break_even_amount ?? 0) ||
            periodDays !== (company.break_even_period_days ?? 30)
    )

    const dailyQuota = $derived(periodDays > 0 ? Math.round((amount ?? 0) / periodDays) : 0)
    const touch = () => ((submitError = ''), (saved = false))

    const submit = () => {
        attempted = true
        touch()
        if (!validation.success) return
        $update.mutate(
            {
                companyId: company.id,
                payload: {
                    break_even_amount: validation.data.break_even_amount,
                    break_even_period_days: validation.data.break_even_period_days
                }
            },
            {
                onSuccess: () => {
                    saved = true
                    attempted = false
                },
                onError: (e) =>
                    (submitError = getErrorMessage(e) ?? 'No se pudo guardar la información.')
            }
        )
    }
</script>

<div class="flex flex-col gap-5">
    <div class="flex items-center gap-2.5">
        <span
            class="flex h-9 w-9 items-center justify-center rounded-xl"
            style="background-color:hsla(217,91%,50%,0.12)"
        >
            <Target size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </span>
        <div>
            <h2 class="text-sm font-bold text-foreground">Punto de equilibrio</h2>
            <p class="text-[11px] text-muted-foreground">Define la meta financiera de tu negocio</p>
        </div>
    </div>

    <div>
        <MoneyInput
            value={amount}
            onValueChange={(v) => ((amount = v), touch())}
            label="Punto de equilibrio mensual *"
            prefix="$ "
            precision={0}
            error={errors['break_even_amount']}
        />
        <p class="mt-1.5 ml-0.5 text-[11px] text-muted-foreground">
            Monto que debes generar en ganancia cada mes para cubrir gastos fijos.
        </p>
    </div>

    <div>
        <div class="mb-2 flex items-baseline justify-between">
            <span class="ml-0.5 text-[13px] font-semibold text-foreground/70">Días del periodo *</span>
            <span class="text-2xl font-bold tabular-nums text-primary">{periodDays}</span>
        </div>
        <RangeSlider
            value={periodDays}
            onValueChange={(v) => ((periodDays = v), touch())}
            min={1}
            max={30}
            step={1}
            ariaLabel="Días del periodo"
        />
        {#if errors['break_even_period_days']}
            <p class="mt-1.5 ml-0.5 text-xs text-destructive">{errors['break_even_period_days']}</p>
        {/if}
        <p class="mt-2 ml-0.5 text-[11px] text-muted-foreground">
            Días en los que se distribuye la meta para sacar la cuota diaria (ej: 26 días = {formatCurrency(
                Math.round((amount ?? 0) / 26)
            )}/día).
        </p>
    </div>

    <!-- Cuota diaria calculada -->
    <div
        class="flex items-center justify-between rounded-2xl border border-primary/30 px-4 py-3.5"
        style="background-color:hsla(217,91%,50%,0.06)"
    >
        <span class="text-sm font-semibold text-foreground">Cuota diaria</span>
        <span class="text-lg font-bold tabular-nums text-primary">{formatCurrency(dailyQuota)}</span>
    </div>

    {#if submitError}
        <StatusBanner kind="error" message={submitError} />
    {:else if saved}
        <StatusBanner kind="success" message="Información guardada" />
    {/if}

    <PrimaryButton
        label="Guardar cambios"
        icon={Save}
        loading={$update.isPending}
        disabled={!dirty}
        onclick={submit}
    />
</div>
