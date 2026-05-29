<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        icon: IconComponent
        label: string
        onclick?: () => void
    }
    let { icon: Icon, label, onclick }: Props = $props()
</script>

<PressableScale
    {onclick}
    class="flex-1"
    ariaLabel={label}
    style="box-shadow:0 6px 12px hsla(222,47%,11%,0.05)"
>
    <span
        class="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4"
    >
        <span
            class="flex h-11 w-11 items-center justify-center rounded-xl"
            style="background-color: hsla(217, 91%, 50%, 0.12)"
        >
            <Icon size={22} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </span>
        <span class="truncate text-xs font-medium text-foreground">{label}</span>
    </span>
</PressableScale>
