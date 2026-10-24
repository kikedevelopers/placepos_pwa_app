<script lang="ts">
    import { ChevronLeft, SquarePen } from '@lucide/svelte'
    import PlaceMark from './PlaceMark.svelte'

    interface Props {
        assistantName: string
        businessName: string
        model?: string | null
        isStreaming: boolean
        canReset: boolean
        onback: () => void
        onnew: () => void
    }
    let { assistantName, businessName, model, isStreaming, canReset, onback, onnew }: Props = $props()
</script>

<header
    class="relative z-10 flex items-center gap-2.5 border-b border-border/50 bg-background/80 px-3 py-2.5 backdrop-blur-xl"
    style="padding-top:calc(var(--app-safe-top) + 0.6rem)"
>
    <button
        type="button"
        onclick={onback}
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-95"
        aria-label="Volver"
    >
        <ChevronLeft size={22} />
    </button>

    <PlaceMark size="sm" active={isStreaming} />

    <div class="min-w-0 flex-1">
        <p class="truncate text-[14px] font-semibold leading-tight text-foreground">{assistantName}</p>
        <p class="truncate text-[11.5px] leading-tight text-muted-foreground">
            {#if isStreaming}
                <span class="place-think">Analizando los datos de tu negocio…</span>
            {:else}
                Asistente de {businessName}
            {/if}
        </p>
    </div>

    {#if model}
        <span
            class="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10.5px] font-medium text-muted-foreground"
        >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {model}
        </span>
    {/if}

    <button
        type="button"
        onclick={onnew}
        disabled={!canReset}
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-95 disabled:opacity-40"
        aria-label="Nueva conversación"
    >
        <SquarePen size={18} />
    </button>
</header>

<style>
    .place-think {
        background: linear-gradient(90deg, hsl(var(--muted-foreground)), hsl(var(--foreground)), hsl(var(--muted-foreground)));
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: place-shimmer 2.2s linear infinite;
    }
    @keyframes place-shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .place-think {
            animation: none;
        }
    }
</style>
