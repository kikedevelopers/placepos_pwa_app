<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'

    /**
     * Interruptor (switch) genérico. Dos modos:
     *  - `card`: fila completa con ícono + título + descripción y el switch.
     *  - `bare`: solo el switch (para cabeceras donde el texto va aparte).
     *
     * El color del track va por estilo inline (hsl explícito) — el repo aplica el
     * primary casi siempre así; evita cualquier dependencia de utilidades de
     * Tailwind que podrían no generarse.
     */
    interface Props {
        checked: boolean
        onChange: (checked: boolean) => void
        label?: string
        description?: string
        icon?: IconComponent
        disabled?: boolean
        tone?: 'primary' | 'success'
        variant?: 'card' | 'bare'
        ariaLabel?: string
    }
    let {
        checked,
        onChange,
        label,
        description,
        icon: Icon,
        disabled = false,
        tone = 'primary',
        variant = 'card',
        ariaLabel
    }: Props = $props()

    const ON = $derived(tone === 'success' ? 'hsl(158, 64%, 42%)' : 'hsl(217, 91%, 50%)')
    const OFF = 'hsl(214, 32%, 80%)'
    const activeText = $derived(tone === 'success' ? 'text-success' : 'text-primary')
    const activeBorder = $derived(
        tone === 'success' ? 'border-success/40 bg-success/5' : 'border-primary/40 bg-primary/5'
    )
</script>

{#if variant === 'bare'}
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        {disabled}
        onclick={() => onChange(!checked)}
        class="inline-flex shrink-0 items-center active:opacity-80 disabled:opacity-50"
    >
        <span
            class="relative block h-7 w-12 rounded-full transition-colors duration-200"
            style="background-color:{checked ? ON : OFF}"
        >
            <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200"
                style="box-shadow:0 1px 3px hsla(222,47%,11%,0.3);{checked
                    ? 'left:24px'
                    : 'left:4px'}"
            ></span>
        </span>
    </button>
{:else}
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        {disabled}
        onclick={() => onChange(!checked)}
        class="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-150 disabled:opacity-60 {checked
            ? activeBorder
            : 'border-border bg-card'}"
    >
        <span class="flex min-w-0 items-center gap-3">
            {#if Icon}
                <Icon
                    size={20}
                    color={checked ? ON : 'hsl(215, 16%, 55%)'}
                    strokeWidth={2}
                />
            {/if}
            <span class="min-w-0">
                {#if label}
                    <span
                        class="block text-sm font-semibold {checked
                            ? activeText
                            : 'text-foreground'}">{label}</span
                    >
                {/if}
                {#if description}
                    <span class="block text-[11px] leading-snug text-muted-foreground"
                        >{description}</span
                    >
                {/if}
            </span>
        </span>
        <span
            class="relative block h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
            style="background-color:{checked ? ON : OFF}"
        >
            <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200"
                style="box-shadow:0 1px 3px hsla(222,47%,11%,0.3);{checked ? 'left:24px' : 'left:4px'}"
            ></span>
        </span>
    </button>
{/if}
