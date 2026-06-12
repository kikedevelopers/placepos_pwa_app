<script lang="ts">
    import { Eye, EyeOff } from '@lucide/svelte'

    interface Props {
        value: string
        label: string
        placeholder?: string
        error?: string
        multiline?: boolean
        inputmode?: 'text' | 'decimal' | 'numeric'
        autocapitalize?: 'none' | 'sentences' | 'characters'
        maxlength?: number
        /** Enmascara el valor (type=password) con botón de mostrar/ocultar. */
        secure?: boolean
        autocomplete?: AutoFill
        oninput?: () => void
    }
    let {
        value = $bindable(),
        label,
        placeholder,
        error,
        multiline = false,
        inputmode = 'text',
        autocapitalize = 'sentences',
        maxlength,
        secure = false,
        autocomplete,
        oninput
    }: Props = $props()

    const BORDER = 'hsla(214, 32%, 89%, 0.9)'
    const FOCUS = 'hsl(217, 91%, 50%)'
    const ERROR = 'hsl(0, 84%, 55%)'

    let focused = $state(false)
    let visible = $state(false)
    const borderColor = $derived(error ? ERROR : focused ? FOCUS : BORDER)
    const fieldId = $derived(`ff-${label.toLowerCase().replace(/\s+/g, '-')}`)
    const masked = $derived(secure && !visible)
</script>

<div>
    <label for={fieldId} class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
        >{label}</label
    >
    <div
        class="rounded-[14px] {multiline ? 'px-3.5 py-3' : 'flex h-[52px] items-center gap-2 px-3.5'}"
        style="border:1.5px solid {borderColor};background-color:hsla(0,0%,100%,0.7)"
    >
        {#if multiline}
            <textarea
                id={fieldId}
                bind:value
                {placeholder}
                {maxlength}
                {oninput}
                onfocus={() => (focused = true)}
                onblur={() => (focused = false)}
                rows="3"
                class="w-full resize-none bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
            ></textarea>
        {:else if masked}
            <!-- type fijo por input: Svelte no permite `type` dinámico con bind:value -->
            <input
                id={fieldId}
                type="password"
                bind:value
                {placeholder}
                {maxlength}
                {autocomplete}
                {oninput}
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                onfocus={() => (focused = true)}
                onblur={() => (focused = false)}
                class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
            />
        {:else}
            <input
                id={fieldId}
                bind:value
                {placeholder}
                {inputmode}
                {autocapitalize}
                {maxlength}
                {autocomplete}
                {oninput}
                autocorrect="off"
                spellcheck="false"
                onfocus={() => (focused = true)}
                onblur={() => (focused = false)}
                class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
            />
        {/if}

        {#if secure && !multiline}
            <button
                type="button"
                onclick={() => (visible = !visible)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                class="shrink-0 text-muted-foreground active:opacity-60"
            >
                {#if visible}
                    <EyeOff size={18} strokeWidth={2} />
                {:else}
                    <Eye size={18} strokeWidth={2} />
                {/if}
            </button>
        {/if}
    </div>
    {#if error}
        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{error}</p>
    {/if}
</div>
