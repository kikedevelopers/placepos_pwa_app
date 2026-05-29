<script lang="ts">
    // El POS es una pantalla inmersiva (fuera del grupo (app), sin header/tabbar),
    // igual que app/pos.tsx en pos_app. Placeholder hasta portar el módulo POS.
    import { ShoppingCart, ArrowLeft } from '@lucide/svelte'
    import { goto } from '$app/navigation'
    import ComingSoon from '$lib/components/ComingSoon.svelte'
</script>

<div class="relative flex min-h-[100dvh] flex-col bg-background">
    <button
        type="button"
        onclick={() => goto('/')}
        class="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-transform active:scale-[0.97]"
        aria-label="Volver"
    >
        <ArrowLeft size={18} color="hsl(215, 16%, 47%)" strokeWidth={2} />
    </button>
    <ComingSoon icon={ShoppingCart} title="Punto de venta" description="Módulo en migración desde pos_app." />
</div>
