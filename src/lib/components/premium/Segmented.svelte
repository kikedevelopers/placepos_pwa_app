<script lang="ts" generics="T extends string">
    import { cn } from '$lib/utils'
    import { thumbTransform, thumbWidth } from './segmented'

    /**
     * Control segmentado iOS: carril gris y un indicador blanco que DESLIZA
     * entre opciones (transform, interrumpible). Segmentos de ancho igual.
     */
    interface Props {
        options: readonly { value: T; label: string }[]
        value: T
        onChange: (value: T) => void
        ariaLabel: string
        class?: string
    }
    let { options, value, onChange, ariaLabel, class: className = '' }: Props = $props()

    const index = $derived(Math.max(0, options.findIndex((o) => o.value === value)))
</script>

<div
    role="radiogroup"
    aria-label={ariaLabel}
    class={cn('relative grid rounded-[12px] bg-foreground/[0.06] p-1', className)}
    style="grid-template-columns:repeat({options.length}, minmax(0, 1fr))"
>
    <span
        aria-hidden="true"
        class="absolute bottom-1 left-1 top-1 rounded-[9px] bg-card shadow-[0_1px_2px_rgba(15,23,42,0.08),0_3px_8px_-2px_rgba(15,23,42,0.10)] transition-transform duration-[280ms] ease-out-strong motion-reduce:transition-none"
        style="width:{thumbWidth(options.length)};transform:{thumbTransform(index, options.length)}"
    ></span>
    {#each options as option (option.value)}
        {@const selected = option.value === value}
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onclick={() => onChange(option.value)}
            class={cn(
                'relative z-10 truncate rounded-[9px] px-2 py-[7px] text-[13px] transition-[color,transform] duration-150 ease-out active:scale-[0.96]',
                selected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
            )}
        >
            {option.label}
        </button>
    {/each}
</div>
