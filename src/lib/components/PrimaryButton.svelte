<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import Spinner from '$lib/components/Spinner.svelte'

    interface Props {
        label: string
        onclick: () => void
        loading?: boolean
        disabled?: boolean
        icon?: IconComponent
    }
    let { label, onclick, loading = false, disabled = false, icon: Icon }: Props = $props()
    const blocked = $derived(loading || disabled)
</script>

<PressableScale
    {onclick}
    disabled={blocked}
    class="block w-full rounded-[14px]"
    style="box-shadow:0 8px 16px hsla(217,91%,50%,0.35)"
>
    <span
        class="flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-semibold tracking-[0.2px] text-primary-foreground"
        style="background:linear-gradient(135deg,hsl(213,94%,58%),hsl(217,91%,50%),hsl(221,83%,45%));opacity:{blocked
            ? 0.7
            : 1}"
    >
        {#if loading}
            <Spinner size={18} color="white" />
        {:else if Icon}
            <Icon size={18} color="white" strokeWidth={2.4} />
        {/if}
        <span class="ml-2">{label}</span>
    </span>
</PressableScale>
