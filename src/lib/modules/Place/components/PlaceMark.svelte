<script lang="ts">
    import { Sparkles } from '@lucide/svelte'

    interface Props {
        size?: 'sm' | 'md' | 'lg'
        /** Late mientras el asistente responde. */
        active?: boolean
        class?: string
    }
    let { size = 'sm', active = false, class: klass = '' }: Props = $props()

    const BOX = { sm: 'h-8 w-8 rounded-[11px]', md: 'h-10 w-10 rounded-[13px]', lg: 'h-16 w-16 rounded-[22px]' }
    const ICON = { sm: 16, md: 20, lg: 32 }
</script>

<span class="relative inline-flex flex-shrink-0 {klass}">
    {#if active}
        <span class="place-pulse absolute inset-0 {BOX[size]}" aria-hidden="true"></span>
    {/if}
    <span
        class="relative flex items-center justify-center text-white ring-1 ring-inset ring-white/20 {BOX[
            size
        ]}"
        style="background-image:linear-gradient(135deg,#1e7df0,#4f46e5);box-shadow:0 8px 22px -8px rgba(30,125,240,0.7)"
    >
        <Sparkles size={ICON[size]} strokeWidth={2} />
    </span>
</span>

<style>
    .place-pulse {
        background: rgba(30, 125, 240, 0.4);
        animation: place-pulse-ring 2s cubic-bezier(0.23, 1, 0.32, 1) infinite;
    }
    @keyframes place-pulse-ring {
        0% {
            transform: scale(1);
            opacity: 0.45;
        }
        70%,
        100% {
            transform: scale(1.7);
            opacity: 0;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .place-pulse {
            animation: none;
            display: none;
        }
    }
</style>
