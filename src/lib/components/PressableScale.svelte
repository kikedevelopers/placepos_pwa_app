<script lang="ts">
    import type { Snippet } from 'svelte'
    import { cn } from '$lib/utils'

    interface Props {
        children: Snippet
        onclick?: (e: MouseEvent) => void
        disabled?: boolean
        class?: string
        style?: string
        ariaLabel?: string
        as?: 'button' | 'div'
    }

    let {
        children,
        onclick,
        disabled = false,
        class: className = '',
        style = '',
        ariaLabel,
        as = 'button'
    }: Props = $props()

    // Feedback de presión (emil-design-eng): scale(0.97) con transición corta y
    // ease-out fuerte. En la web es CSS puro, off-main-thread.
    const base =
        'transition-transform duration-150 ease-out-strong active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100 outline-none'

    function handleKey(e: KeyboardEvent) {
        if (as !== 'div' || disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onclick?.(e as unknown as MouseEvent)
        }
    }
</script>

<svelte:element
    this={as}
    type={as === 'button' ? 'button' : undefined}
    class={cn(base, className)}
    {style}
    disabled={as === 'button' ? disabled : undefined}
    role={as === 'div' ? 'button' : undefined}
    tabindex={as === 'div' ? 0 : undefined}
    aria-label={ariaLabel}
    onclick={disabled ? undefined : onclick}
    onkeydown={handleKey}
>
    {@render children()}
</svelte:element>
