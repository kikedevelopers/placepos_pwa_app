<script lang="ts">
    import { TrendingUp, Wallet, Boxes, Users } from '@lucide/svelte'
    import PlaceMark from './PlaceMark.svelte'

    interface Props {
        userName: string
        businessName: string
        greeting: string
        loadingGreeting: boolean
        onpick: (prompt: string) => void
    }
    let { userName, businessName, greeting, loadingGreeting, onpick }: Props = $props()

    const SUGGESTIONS = [
        { icon: TrendingUp, title: '¿Cómo van las ventas hoy?', prompt: '¿Cómo van las ventas de hoy?' },
        { icon: Wallet, title: 'Saldos de caja y bancos', prompt: '¿Cuánto tengo en caja y en los bancos?' },
        { icon: Boxes, title: 'Productos por agotarse', prompt: '¿Qué productos están por agotarse?' },
        { icon: Users, title: 'Clientes que me deben', prompt: '¿Qué clientes tienen crédito pendiente?' }
    ]
</script>

<div class="flex min-h-full flex-col items-center justify-center px-5 py-8 text-center">
    <div class="relative">
        <span class="place-halo" aria-hidden="true"></span>
        <PlaceMark size="lg" class="relative" />
    </div>

    <h2 class="mt-5 text-[22px] font-semibold tracking-tight text-foreground">Hola, {userName}</h2>

    {#if loadingGreeting}
        <div class="mt-2 flex w-full max-w-xs flex-col items-center gap-2" aria-hidden="true">
            <span class="h-3 w-full animate-pulse rounded-full bg-muted"></span>
            <span class="h-3 w-2/3 animate-pulse rounded-full bg-muted"></span>
        </div>
    {:else}
        <p class="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">{greeting}</p>
    {/if}

    <div class="mt-7 grid w-full max-w-md grid-cols-1 gap-2.5">
        {#each SUGGESTIONS as s (s.title)}
            <button
                type="button"
                onclick={() => onpick(s.prompt)}
                class="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 text-left backdrop-blur-sm transition-transform active:scale-[0.99]"
            >
                <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary"
                    style="background-color:hsla(217,91%,50%,0.12)"
                >
                    <s.icon size={18} />
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block truncate text-[13px] font-medium text-foreground">{s.title}</span>
                </span>
            </button>
        {/each}
    </div>

    <p class="mt-5 text-[11px] text-muted-foreground/70">
        {businessName} · La IA puede equivocarse, verifica lo importante.
    </p>
</div>

<style>
    .place-halo {
        position: absolute;
        inset: -2.5rem;
        border-radius: 9999px;
        background: radial-gradient(circle, rgba(30, 125, 240, 0.2), transparent 62%);
        pointer-events: none;
    }
</style>
