<script lang="ts">
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { cn } from '$lib/utils'
    import { todayISO } from '$lib/utils/dates'
    import { RANGE_PRESETS, makeRange, rangeCaption, type DateRangeValue, type RangeMode } from './dateRange'

    interface Props {
        open: boolean
        value: DateRangeValue
        onClose: () => void
        onApply: (value: DateRangeValue) => void
    }
    let { open, value, onClose, onApply }: Props = $props()

    // Borrador local: solo se confirma al pulsar "Aplicar".
    let draft = $state<DateRangeValue>(makeRange('month'))

    $effect(() => {
        if (open) draft = { ...value }
    })

    const pickPreset = (mode: Exclude<RangeMode, 'custom'>) => {
        draft = makeRange(mode)
    }
    const editFrom = (v: string) => {
        if (!v) return
        draft = { mode: 'custom', from: v, to: draft.to < v ? v : draft.to }
    }
    const editTo = (v: string) => {
        if (!v) return
        draft = { mode: 'custom', from: draft.from > v ? v : draft.from, to: v }
    }

    const max = todayISO()
    const DATE_INPUT =
        'h-11 w-full rounded-[12px] bg-foreground/[0.055] px-3 text-[15px] font-medium tabular-nums text-foreground outline-none focus:bg-card focus:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]'
</script>

<BottomSheet {open} title="Periodo" {onClose}>
    <div class="flex flex-col gap-6 pb-1">
        <div class="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Periodos rápidos">
            {#each RANGE_PRESETS as p (p.id)}
                {@const active = draft.mode === p.id}
                <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onclick={() => pickPreset(p.id)}
                    class={cn(
                        'h-10 rounded-[12px] text-[13.5px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95]',
                        active
                            ? 'bg-foreground font-semibold text-background'
                            : 'bg-foreground/[0.055] font-medium text-foreground'
                    )}
                >
                    {p.label}
                </button>
            {/each}
        </div>

        <div class="flex flex-col gap-2">
            <p class="text-[13px] font-semibold text-foreground">Rango personalizado</p>
            <div class="grid grid-cols-2 gap-2">
                <label class="flex flex-col gap-1">
                    <span class="text-[12px] text-muted-foreground">Desde</span>
                    <input
                        type="date"
                        value={draft.from}
                        {max}
                        onchange={(e) => editFrom(e.currentTarget.value)}
                        class={DATE_INPUT}
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="text-[12px] text-muted-foreground">Hasta</span>
                    <input
                        type="date"
                        value={draft.to}
                        min={draft.from}
                        {max}
                        onchange={(e) => editTo(e.currentTarget.value)}
                        class={DATE_INPUT}
                    />
                </label>
            </div>
            <p class="text-[12.5px] text-muted-foreground">Seleccionado: {rangeCaption(draft)}</p>
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
