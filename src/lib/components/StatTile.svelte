<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'

    interface Props {
        icon: IconComponent
        label: string
        value: string
        bg: string
        fg: string
    }
    let { icon: Icon, label, value, bg, fg }: Props = $props()
</script>

<div
    class="flex-1 rounded-2xl border border-border bg-card p-4"
    style="box-shadow:0 6px 12px hsla(222,47%,11%,0.05)"
>
    <div
        class="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
        style="background-color:{bg}"
    >
        <Icon size={18} color={fg} strokeWidth={2} />
    </div>
    <p class="truncate text-base font-bold text-foreground">{value}</p>
    <p class="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
</div>
