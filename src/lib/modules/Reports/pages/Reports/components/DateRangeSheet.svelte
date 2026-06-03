<script lang="ts">
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { todayISO } from '$lib/utils/dates'
    import { RANGE_PRESETS, makeRange, presetRange, type DateRangeValue, type RangeMode } from './dateRange'

    interface Props {
        open: boolean
        value: DateRangeValue
        onClose: () => void
        onApply: (value: DateRangeValue) => void
    }
    let { open, value, onClose, onApply }: Props = $props()

    // Borrador local: solo se confirma al pulsar "Aplicar". Se inicializa con un
    // preset neutro (no se muestra cerrado) y se sincroniza con `value` al abrir.
    let draft = $state<DateRangeValue>(makeRange('month'))

    // Re-sincroniza el borrador cada vez que se abre el sheet.
    $effect(() => {
        if (open) draft = { ...value }
    })

    const pickPreset = (mode: Exclude<RangeMode, 'custom'>) => {
        draft = makeRange(mode)
    }

    const editFrom = (v: string) => {
        draft = { mode: 'custom', from: v, to: draft.to < v ? v : draft.to }
    }
    const editTo = (v: string) => {
        draft = { mode: 'custom', from: draft.from, to: v }
    }

    const max = todayISO()
</script>

<BottomSheet {open} title="Rango de fechas" {onClose}>
    <div class="flex flex-col gap-5 pb-1">
        <!-- Presets rápidos -->
        <div class="grid grid-cols-3 gap-2">
            {#each RANGE_PRESETS as p (p.id)}
                {@const active = draft.mode === p.id}
                <button
                    type="button"
                    onclick={() => pickPreset(p.id)}
                    class="rounded-xl border py-2.5 text-xs font-semibold transition-opacity active:opacity-80 {active
                        ? 'border-transparent text-white'
                        : 'border-border bg-card text-muted-foreground'}"
                    style={active ? 'background-color: hsl(217, 91%, 50%)' : ''}
                >
                    {p.label}
                </button>
            {/each}
        </div>

        <!-- Rango manual -->
        <div class="flex flex-col gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Personalizado
            </p>
            <div class="flex items-center gap-2">
                <input
                    type="date"
                    value={draft.from}
                    {max}
                    onchange={(e) => editFrom(e.currentTarget.value)}
                    class="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
                    aria-label="Fecha inicial"
                />
                <span class="text-xs text-muted-foreground">a</span>
                <input
                    type="date"
                    value={draft.to}
                    min={draft.from}
                    {max}
                    onchange={(e) => editTo(e.currentTarget.value)}
                    class="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
                    aria-label="Fecha final"
                />
            </div>
        </div>
    </div>

    {#snippet footer()}
        <PrimaryButton
            label="Aplicar"
            onclick={() => {
                onApply({ ...draft })
                onClose()
            }}
        />
    {/snippet}
</BottomSheet>
