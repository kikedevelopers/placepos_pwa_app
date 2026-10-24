<script lang="ts">
    import type { Snippet } from 'svelte'
    import { ChevronRight } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { cn } from '$lib/utils'
    import { TONE_SOFT, TONE_TEXT, type Tone } from './tones'

    /**
     * Fila de lista agrupada: [icono] etiqueta / detalle ··· valor [chevron].
     * Si recibe `onclick` es pulsable (feedback de presión con fondo, como iOS).
     * `level` sangra las sub-filas de un desglose.
     */
    interface Props {
        label: string
        detail?: string
        icon?: IconComponent
        iconTone?: Tone
        value?: Snippet
        valueText?: string
        valueTone?: Tone
        emphasis?: 'normal' | 'strong' | 'total'
        level?: 0 | 1
        onclick?: () => void
        chevron?: boolean
        ariaLabel?: string
    }
    let {
        label,
        detail,
        icon: Icon,
        iconTone = 'brand',
        value,
        valueText,
        valueTone = 'neutral',
        emphasis = 'normal',
        level = 0,
        onclick,
        chevron,
        ariaLabel
    }: Props = $props()

    const showChevron = $derived(chevron ?? Boolean(onclick))
    const classes = $derived(
        cn(
            'row flex w-full items-center gap-3 px-4 text-left',
            emphasis === 'total' ? 'py-3.5' : 'py-3',
            emphasis === 'total' && 'bg-foreground/[0.025]',
            level === 1 && 'pl-8',
            onclick &&
                'transition-[background-color,transform] duration-100 ease-out active:bg-foreground/[0.05]'
        )
    )
</script>

{#snippet body()}
    {#if Icon}
        <span class={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]', TONE_SOFT[iconTone])}>
            <Icon size={16} strokeWidth={2.1} />
        </span>
    {/if}
    <span class="min-w-0 flex-1">
        <span
            class={cn(
                'block truncate',
                level === 1 ? 'text-[13.5px] text-muted-foreground' : 'text-[14.5px] text-foreground',
                emphasis !== 'normal' && 'font-semibold'
            )}
        >
            {label}
        </span>
        {#if detail}
            <span class="mt-0.5 block truncate text-[12px] text-muted-foreground">{detail}</span>
        {/if}
    </span>
    {#if value}
        <span class={cn('shrink-0', TONE_TEXT[valueTone])}>{@render value()}</span>
    {:else if valueText !== undefined}
        <span
            class={cn(
                'shrink-0 tabular-nums',
                emphasis === 'total' ? 'text-[15.5px] font-semibold' : 'text-[14.5px] font-medium',
                TONE_TEXT[valueTone]
            )}
        >
            {valueText}
        </span>
    {/if}
    {#if showChevron}
        <ChevronRight size={16} class="-mr-1 shrink-0 text-muted-foreground/50" />
    {/if}
{/snippet}

{#if onclick}
    <button type="button" class={classes} {onclick} aria-label={ariaLabel}>
        {@render body()}
    </button>
{:else}
    <div class={classes}>
        {@render body()}
    </div>
{/if}
