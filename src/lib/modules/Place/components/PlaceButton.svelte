<script lang="ts">
    import { Sparkles, Sparkle, ChevronRight } from '@lucide/svelte'

    interface Props {
        onclick: () => void
        assistantName?: string
    }
    let { onclick, assistantName = 'Place' }: Props = $props()
</script>

<button type="button" {onclick} class="place-btn" aria-label={`Hablar con ${assistantName}`}>
    <span class="place-sheen" aria-hidden="true"></span>

    <span class="place-avatar">
        <span class="place-glow" aria-hidden="true"></span>
        <Sparkle class="place-tw place-tw-1" size={12} aria-hidden="true" />
        <Sparkle class="place-tw place-tw-2" size={10} aria-hidden="true" />
        <Sparkle class="place-tw place-tw-3" size={8} aria-hidden="true" />
        <Sparkles size={22} strokeWidth={2} />
    </span>

    <span class="min-w-0 flex-1 text-left">
        <span class="block text-[15px] font-semibold leading-tight">Pregúntale a {assistantName}</span>
        <span class="mt-0.5 block text-[12px] leading-tight text-white/80">
            Tu asistente del negocio · ventas, caja, inventario…
        </span>
    </span>

    <ChevronRight size={20} class="shrink-0 text-white/80" />
</button>

<style>
    .place-btn {
        position: relative;
        display: flex;
        width: 100%;
        align-items: center;
        gap: 0.75rem;
        overflow: hidden;
        border-radius: 1.25rem;
        padding: 0.9rem 1rem;
        color: #fff;
        background-image: linear-gradient(120deg, #1e7df0 0%, #3b6fe8 45%, #4f46e5 100%);
        box-shadow: 0 16px 36px -14px rgba(30, 125, 240, 0.75);
        transition: transform 0.18s cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 0.18s cubic-bezier(0.23, 1, 0.32, 1);
        -webkit-tap-highlight-color: transparent;
    }
    .place-btn:active {
        transform: scale(0.98);
        box-shadow: 0 10px 24px -14px rgba(30, 125, 240, 0.7);
    }
    /* Halo cónico que gira muy lento: "IA viva" sin marear. */
    .place-sheen {
        position: absolute;
        inset: -40%;
        background: conic-gradient(
            from 0deg,
            transparent 0%,
            rgba(255, 255, 255, 0.22) 12%,
            transparent 30%,
            transparent 55%,
            rgba(255, 255, 255, 0.14) 70%,
            transparent 88%
        );
        animation: place-spin 9s linear infinite;
        pointer-events: none;
    }
    .place-avatar {
        position: relative;
        display: flex;
        height: 2.75rem;
        width: 2.75rem;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 0.9rem;
        background: rgba(255, 255, 255, 0.16);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }
    .place-glow {
        position: absolute;
        inset: -30%;
        border-radius: 9999px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.35), transparent 70%);
        filter: blur(6px);
        pointer-events: none;
    }
    /* Destellos que titilan, escalonados. */
    .place-btn :global(.place-tw) {
        position: absolute;
        color: #fff;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
        animation: place-twinkle 2.6s cubic-bezier(0.23, 1, 0.32, 1) infinite;
    }
    .place-btn :global(.place-tw-1) {
        top: -4px;
        right: -2px;
        animation-delay: 0.2s;
    }
    .place-btn :global(.place-tw-2) {
        bottom: -2px;
        left: -4px;
        animation-delay: 1.1s;
    }
    .place-btn :global(.place-tw-3) {
        top: 6px;
        left: 2px;
        animation-delay: 1.9s;
    }
    @keyframes place-spin {
        to {
            transform: rotate(360deg);
        }
    }
    @keyframes place-twinkle {
        0%,
        100% {
            transform: scale(0.35) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: scale(1) rotate(45deg);
            opacity: 1;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .place-sheen,
        .place-btn :global(.place-tw) {
            animation: none;
        }
        .place-btn :global(.place-tw) {
            display: none;
        }
    }
</style>
