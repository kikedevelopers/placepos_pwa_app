<script lang="ts">
    import { CalendarDays, ChevronDown } from '@lucide/svelte'
    import { todayISO } from '$lib/utils/dates'
    import { summaryDateLabel } from '../utils/summaryDate'

    /**
     * Selector de UN día (hoy por defecto, nunca futuro). Abre el selector
     * nativo del sistema (rueda en iOS) directamente, sin sheet intermedio.
     */
    interface Props {
        value: string
        onChange: (date: string) => void
    }
    let { value, onChange }: Props = $props()

    const max = todayISO()
    let input = $state<HTMLInputElement | null>(null)

    const open = () => {
        if (!input) return
        if (typeof input.showPicker === 'function') input.showPicker()
        else input.focus()
    }
</script>

<button
    type="button"
    onclick={open}
    class="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-card pl-3 pr-2.5 text-[13px] font-semibold text-foreground shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] transition-transform duration-150 ease-out active:scale-[0.96]"
    aria-label="Cambiar día"
>
    <CalendarDays size={15} strokeWidth={2.2} />
    <span class="tabular-nums">{summaryDateLabel(value, max)}</span>
    <ChevronDown size={14} strokeWidth={2.2} class="opacity-50" />
    <input
        bind:this={input}
        type="date"
        {value}
        {max}
        onchange={(e) => {
            const v = e.currentTarget.value
            if (v && v <= max) onChange(v)
        }}
        class="pointer-events-none absolute inset-0 opacity-0"
        tabindex="-1"
        aria-hidden="true"
    />
</button>
