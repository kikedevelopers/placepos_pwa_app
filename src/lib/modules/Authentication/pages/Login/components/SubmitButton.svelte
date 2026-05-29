<script lang="ts">
    import { LogIn } from '@lucide/svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import Spinner from '$lib/components/Spinner.svelte'

    interface Props {
        loading: boolean
        label: string
        loadingLabel: string
        onclick: (e: Event) => void
    }

    let { loading, label, loadingLabel, onclick }: Props = $props()
</script>

<PressableScale
    {onclick}
    disabled={loading}
    class="block w-full rounded-[14px]"
    style="box-shadow:0 8px 16px hsla(217,91%,50%,0.35)"
>
    <span
        class="flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-semibold tracking-[0.2px] text-primary-foreground"
        style="background:linear-gradient(135deg,hsl(213,94%,58%),hsl(217,91%,50%),hsl(221,83%,45%));opacity:{loading
            ? 0.85
            : 1}"
    >
        {#if loading}
            <Spinner size={18} color="white" />
        {:else}
            <LogIn size={18} color="white" strokeWidth={2.4} />
        {/if}
        <span class="ml-2.5">{loading ? loadingLabel : label}</span>
    </span>
</PressableScale>
