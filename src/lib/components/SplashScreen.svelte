<!--
 Pantalla de pre-carga (splash) que cubre TODA la ventana en que aún no se sabe
 si mostrar el login o el dashboard: hidratación del token + decisión de
 redirección. Evita el parpadeo del dashboard antes de caer al login.

 Reutiliza el lenguaje visual del Login (orbes `primary` difuminados + el badge
 con gradiente azul y el ícono Store) para que la transición al login sea
 perfectamente continua. Tokens del tema → se ve bien en claro y oscuro.
-->
<script lang="ts">
    import { Store } from '@lucide/svelte'
</script>

<div class="splash fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background">
    <!-- Backdrop premium: base + orbes primary difuminados (tema-aware) -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
            class="absolute inset-0"
            style="background:linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, transparent 50%, hsl(var(--primary) / 0.05) 100%)"
        ></div>
        <div
            class="absolute rounded-full"
            style="width:420px;height:420px;top:-110px;left:-90px;background:hsl(var(--primary) / 0.10);filter:blur(52px)"
        ></div>
        <div
            class="absolute rounded-full"
            style="width:300px;height:300px;bottom:-60px;right:-80px;background:hsl(var(--primary) / 0.08);filter:blur(52px)"
        ></div>
    </div>

    <!-- Marca -->
    <div class="brand relative flex flex-col items-center">
        <div class="relative mb-6">
            <!-- Halo que respira detrás del badge -->
            <div
                class="halo absolute -inset-4 rounded-full"
                style="background:hsl(var(--primary) / 0.18)"
                aria-hidden="true"
            ></div>
            <div
                class="relative flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-[24px]"
                style="background:linear-gradient(135deg,hsl(213,94%,60%),hsl(217,91%,50%),hsl(221,83%,44%));box-shadow:0 12px 26px hsla(217,91%,50%,0.42)"
            >
                <div
                    class="pointer-events-none absolute inset-x-0 top-0 h-[40px]"
                    style="background:linear-gradient(to bottom, hsla(0,0%,100%,0.30), hsla(0,0%,100%,0))"
                ></div>
                <Store size={36} color="white" strokeWidth={2} />
            </div>
        </div>

        <h1 class="text-[26px] font-bold tracking-[-0.6px] text-foreground">PlacePOS</h1>
        <p class="mt-1.5 text-sm text-muted-foreground">Preparando tu espacio de trabajo</p>

        <!-- Indicador de carga indeterminado: barra deslizante sutil -->
        <div
            class="track relative mt-7 h-[3px] w-[140px] overflow-hidden rounded-full"
            style="background:hsl(var(--primary) / 0.14)"
            role="status"
            aria-label="Cargando"
        >
            <div
                class="bar absolute inset-y-0 left-0 w-2/5 rounded-full"
                style="background:linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)"
            ></div>
        </div>
    </div>
</div>

<style>
    .splash {
        animation: splash-in 0.35s ease-out both;
    }

    .brand {
        animation: brand-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .halo {
        animation: halo-breathe 2.4s ease-in-out infinite;
    }

    .bar {
        animation: bar-slide 1.25s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }

    @keyframes splash-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes brand-rise {
        from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @keyframes halo-breathe {
        0%,
        100% {
            transform: scale(1);
            opacity: 0.7;
        }
        50% {
            transform: scale(1.12);
            opacity: 1;
        }
    }

    @keyframes bar-slide {
        0% {
            left: -40%;
        }
        100% {
            left: 100%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .splash,
        .brand,
        .halo,
        .bar {
            animation: none;
        }
        /* Sin movimiento, la barra queda como indicador estático centrado. */
        .bar {
            left: 30%;
        }
    }
</style>
