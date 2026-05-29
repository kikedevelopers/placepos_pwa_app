<script lang="ts">
    import type { Snippet } from 'svelte'
    import { ChevronDown } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'

    interface Props {
        title: string
        subtitle?: string
        icon: IconComponent
        iconColor: string
        iconBg: string
        trailing?: Snippet
        children: Snippet
    }
    let { title, subtitle, icon: Icon, iconColor, iconBg, trailing, children }: Props = $props()

    let open = $state(false)
</script>

<!--
 Accordion equivalente al CollapsibleSection de placepos. En web se usa la
 técnica grid-rows 0fr→1fr (anima la altura sin medirla con JS). Respeta
 reduced-motion vía el override global de app.css.
-->
<div class="overflow-hidden rounded-2xl border border-border bg-card">
    <button
        type="button"
        onclick={() => (open = !open)}
        aria-expanded={open}
        class="flex w-full items-center gap-3 px-4 py-3 transition-opacity active:opacity-70"
    >
        <span
            class="flex h-9 w-9 items-center justify-center rounded-xl"
            style="background-color:{iconBg}"
        >
            <Icon size={17} color={iconColor} strokeWidth={2.2} />
        </span>

        <span class="min-w-0 flex-1 text-left">
            <span class="block truncate text-sm font-semibold text-foreground">{title}</span>
            {#if subtitle}
                <span class="block truncate text-xs text-muted-foreground">{subtitle}</span>
            {/if}
        </span>

        {#if trailing}
            {@render trailing()}
        {/if}

        <span class="transition-transform duration-200 ease-out-strong {open ? 'rotate-180' : ''}">
            <ChevronDown size={18} color="hsl(215, 16%, 55%)" strokeWidth={2.2} />
        </span>
    </button>

    <div
        class="grid transition-[grid-template-rows] duration-200 ease-out-strong"
        style="grid-template-rows:{open ? '1fr' : '0fr'}"
    >
        <div class="overflow-hidden">
            <div class="border-t border-border/50 px-4 pb-4 pt-1">
                {@render children()}
            </div>
        </div>
    </div>
</div>
