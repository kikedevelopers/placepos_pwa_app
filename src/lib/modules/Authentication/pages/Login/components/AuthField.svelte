<script lang="ts">
    import { AlertCircle, Eye, EyeOff } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'

    interface Props {
        value: string
        label: string
        placeholder: string
        icon: IconComponent
        invalid?: boolean
        errorMessage?: string
        secure?: boolean
        autocomplete?: AutoFill
        oninteract?: () => void
    }

    let {
        value = $bindable(),
        label,
        placeholder,
        icon: Icon,
        invalid = false,
        errorMessage,
        secure = false,
        autocomplete,
        oninteract
    }: Props = $props()

    const COLORS = {
        primary: 'hsl(217, 91%, 50%)',
        destructive: 'hsl(0, 84%, 55%)',
        muted: 'hsl(215, 16%, 55%)'
    }

    let focused = $state(false)
    let reveal = $state(false)
    const fieldId = $derived(`auth-field-${label.toLowerCase().replace(/\s+/g, '-')}`)

    const iconColor = $derived(
        invalid ? COLORS.destructive : focused ? COLORS.primary : COLORS.muted
    )
    const borderColor = $derived(
        invalid ? COLORS.destructive : focused ? COLORS.primary : 'hsla(214, 32%, 89%, 0.9)'
    )
</script>

<div>
    <label for={fieldId} class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
        >{label}</label
    >
    <div class="relative">
        <!-- ring de foco: aparece con opacidad, color según estado (emil: ease-out) -->
        <div
            class="pointer-events-none absolute -inset-[3px] rounded-[17px] border-[1.5px] transition-opacity duration-200 ease-out-strong"
            style="opacity:{focused ? 1 : 0};border-color:{invalid
                ? COLORS.destructive
                : COLORS.primary}"
            aria-hidden="true"
        ></div>

        <div
            class="flex h-[52px] items-center rounded-[14px] border-[1.5px] px-3.5 transition-colors duration-200 ease-out-strong"
            style="border-color:{borderColor};background-color:hsla(0,0%,100%,0.7)"
        >
            {#key invalid || focused}
                <Icon size={18} color={iconColor} strokeWidth={2} />
            {/key}
            <input
                id={fieldId}
                {placeholder}
                {autocomplete}
                type={secure && !reveal ? 'password' : 'text'}
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                bind:value
                oninput={() => oninteract?.()}
                onfocus={() => (focused = true)}
                onblur={() => (focused = false)}
                class="ml-3 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
            />
            {#if secure}
                <button
                    type="button"
                    onclick={() => (reveal = !reveal)}
                    class="ml-2 transition-opacity active:opacity-60"
                    aria-label={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {#if reveal}
                        <EyeOff size={18} color={COLORS.muted} />
                    {:else}
                        <Eye size={18} color={COLORS.muted} />
                    {/if}
                </button>
            {/if}
        </div>
    </div>
    {#if errorMessage}
        <div class="mt-2 ml-0.5 flex items-center gap-1.5">
            <AlertCircle size={13} color={COLORS.destructive} />
            <span class="text-xs text-destructive">{errorMessage}</span>
        </div>
    {/if}
</div>
