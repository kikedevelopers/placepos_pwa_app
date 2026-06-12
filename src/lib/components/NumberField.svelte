<script lang="ts">
    /**
     * Input numérico (entero o decimal) con el mismo look que FormField. Maneja
     * value `number | null` vía callback (no bind) para evitar coerciones raras.
     */
    interface Props {
        value: number | null
        onValueChange: (value: number | null) => void
        label?: string
        placeholder?: string
        error?: string
        suffix?: string
        min?: number
        step?: number
        integer?: boolean
    }
    let {
        value,
        onValueChange,
        label,
        placeholder = '0',
        error,
        suffix,
        min,
        step,
        integer = false
    }: Props = $props()

    const BORDER = 'hsla(214, 32%, 89%, 0.9)'
    const FOCUS = 'hsl(217, 91%, 50%)'
    const ERROR = 'hsl(0, 84%, 55%)'

    let focused = $state(false)
    const borderColor = $derived(error ? ERROR : focused ? FOCUS : BORDER)
    const fieldId = $derived(label ? `num-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    const handleInput = (e: Event) => {
        const raw = (e.currentTarget as HTMLInputElement).value
        if (raw === '') {
            onValueChange(null)
            return
        }
        const n = integer ? parseInt(raw, 10) : Number(raw)
        onValueChange(Number.isFinite(n) ? n : null)
    }
</script>

<div>
    {#if label}
        <label for={fieldId} class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
            >{label}</label
        >
    {/if}
    <div
        class="flex h-[52px] items-center rounded-[14px] px-3.5"
        style="border:1.5px solid {borderColor};background-color:hsla(0,0%,100%,0.7)"
    >
        <input
            id={fieldId}
            value={value ?? ''}
            {placeholder}
            {min}
            {step}
            type="number"
            inputmode={integer ? 'numeric' : 'decimal'}
            oninput={handleInput}
            onfocus={() => (focused = true)}
            onblur={() => (focused = false)}
            class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
        />
        {#if suffix}
            <span class="ml-1 text-base text-muted-foreground">{suffix}</span>
        {/if}
    </div>
    {#if error}
        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{error}</p>
    {/if}
</div>
