<script lang="ts">
    interface Props {
        value: number | null
        onValueChange: (value: number | null) => void
        label?: string
        prefix?: string
        precision?: number
        placeholder?: string
        error?: string
        onblur?: () => void
    }
    let {
        value,
        onValueChange,
        label,
        prefix,
        precision = 2,
        placeholder = '0',
        error,
        onblur
    }: Props = $props()

    const BORDER = 'hsla(214, 32%, 89%, 0.9)'
    const FOCUS = 'hsl(217, 91%, 50%)'
    const ERROR = 'hsl(0, 84%, 55%)'

    let focused = $state(false)
    let raw = $state('')

    // Formato es-CO (miles ".", decimal ","), equivalente al NumericInput de placepos.
    const group = (n: number) =>
        new Intl.NumberFormat('es-CO', { maximumFractionDigits: precision }).format(n)

    const parse = (s: string): number | null => {
        const t = s.replace(/[^\d.,]/g, '')
        if (!t) return null
        const normalized = t.replace(/\./g, '').replace(',', '.')
        const n = Number(normalized)
        return Number.isFinite(n) ? n : null
    }

    const display = $derived(focused ? raw : value == null ? '' : group(value))
    const borderColor = $derived(error ? ERROR : focused ? FOCUS : BORDER)
    const fieldId = $derived(label ? `money-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    const handleFocus = () => {
        focused = true
        raw = value == null ? '' : String(value).replace('.', ',')
    }
    const handleInput = (e: Event) => {
        raw = (e.currentTarget as HTMLInputElement).value
        onValueChange(parse(raw))
    }
    const handleBlur = () => {
        focused = false
        onblur?.()
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
        {#if prefix}
            <span class="text-base text-muted-foreground">{prefix}</span>
        {/if}
        <input
            id={fieldId}
            value={display}
            {placeholder}
            inputmode="decimal"
            oninput={handleInput}
            onfocus={handleFocus}
            onblur={handleBlur}
            class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
        />
    </div>
    {#if error}
        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{error}</p>
    {/if}
</div>
