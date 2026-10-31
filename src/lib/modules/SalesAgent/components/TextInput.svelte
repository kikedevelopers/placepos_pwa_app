<script lang="ts">
    import { cn } from '$lib/utils'

    /**
     * Campo de texto del kit premium: relleno gris sin borde (como la búsqueda),
     * se ilumina al enfocarlo. Etiqueta arriba, ayuda o error abajo y contador
     * cuando hay máximo.
     */
    interface Props {
        id: string
        label: string
        value: string
        placeholder?: string
        hint?: string
        error?: string
        maxlength?: number
        multiline?: boolean
        rows?: number
        type?: 'text' | 'password'
        inputmode?: 'text' | 'numeric' | 'tel'
        autocomplete?: AutoFill
        oninput?: () => void
    }
    let {
        id,
        label,
        value = $bindable(),
        placeholder,
        hint,
        error,
        maxlength,
        multiline = false,
        rows = 3,
        type = 'text',
        inputmode = 'text',
        autocomplete = 'off',
        oninput
    }: Props = $props()

    const FIELD =
        'w-full rounded-[14px] bg-foreground/[0.055] px-3.5 text-[15px] text-foreground outline-none transition-[background-color,box-shadow] duration-150 placeholder:text-muted-foreground/75 focus:bg-card'
</script>

<div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-2 px-0.5">
        <label for={id} class="text-[13px] font-semibold text-foreground">{label}</label>
        {#if maxlength}
            <span class="text-[11.5px] tabular-nums text-muted-foreground">{value.length}/{maxlength}</span>
        {/if}
    </div>
    {#if multiline}
        <textarea
            {id}
            bind:value
            {placeholder}
            {maxlength}
            {rows}
            {oninput}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error || hint ? `${id}-help` : undefined}
            class={cn(
                FIELD,
                'resize-none py-3 leading-snug',
                error ? 'shadow-[0_0_0_1.5px_hsl(var(--destructive)/0.6)]' : 'focus:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]'
            )}
        ></textarea>
    {:else}
        <input
            {id}
            bind:value
            {type}
            {placeholder}
            {maxlength}
            {inputmode}
            {autocomplete}
            {oninput}
            autocapitalize="none"
            spellcheck="false"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error || hint ? `${id}-help` : undefined}
            class={cn(
                FIELD,
                'h-12',
                error ? 'shadow-[0_0_0_1.5px_hsl(var(--destructive)/0.6)]' : 'focus:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]'
            )}
        />
    {/if}
    {#if error}
        <p id={`${id}-help`} role="alert" class="px-0.5 text-[12.5px] text-destructive">{error}</p>
    {:else if hint}
        <p id={`${id}-help`} class="px-0.5 text-[12.5px] leading-snug text-muted-foreground">{hint}</p>
    {/if}
</div>
