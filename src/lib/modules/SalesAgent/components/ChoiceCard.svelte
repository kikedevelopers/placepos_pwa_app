<script lang="ts">
    import { Check } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import type { IconComponent } from '$lib/types/icon'

    /**
     * Opción seleccionable con icono, título y una línea de ayuda. `radio` para
     * elegir una (personalidad, stock); `checkbox` para varias (pagos, entregas).
     * Lo elegido se nota por el anillo del color primario y el check, no solo
     * por el color.
     */
    interface Props {
        role: 'radio' | 'checkbox'
        checked: boolean
        label: string
        description?: string
        icon?: IconComponent
        onclick: () => void
    }
    let { role, checked, label, description, icon: Icon, onclick }: Props = $props()
</script>

<button
    type="button"
    {role}
    aria-checked={checked}
    {onclick}
    class={cn(
        'flex w-full items-center gap-3 rounded-[16px] px-3.5 py-3 text-left transition-[background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.985]',
        checked
            ? 'bg-primary/[0.07] shadow-[inset_0_0_0_1.5px_hsl(var(--primary)/0.65)]'
            : 'bg-card shadow-[inset_0_0_0_1px_rgba(15,23,42,0.09)]'
    )}
>
    {#if Icon}
        <span
            class={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors duration-150',
                checked ? 'bg-primary/15 text-primary' : 'bg-foreground/[0.05] text-muted-foreground'
            )}
        >
            <Icon size={18} strokeWidth={2.1} />
        </span>
    {/if}
    <span class="min-w-0 flex-1">
        <span class="block text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">{label}</span>
        {#if description}
            <span class="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{description}</span>
        {/if}
    </span>
    <span
        aria-hidden="true"
        class={cn(
            'flex h-[22px] w-[22px] shrink-0 items-center justify-center transition-[background-color,box-shadow] duration-150',
            role === 'radio' ? 'rounded-full' : 'rounded-[7px]',
            checked ? 'bg-primary text-white' : 'shadow-[inset_0_0_0_1.5px_rgba(15,23,42,0.18)]'
        )}
    >
        {#if checked}<Check size={14} strokeWidth={3} />{/if}
    </span>
</button>
