<script lang="ts">
    import { Store } from '@lucide/svelte'
</script>

<div class="flex flex-col items-center">
    <div class="relative mb-5">
        <div
            class="absolute -inset-3 rounded-full"
            style="background-color: hsla(217, 91%, 50%, 0.15)"
        ></div>
        <div
            class="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[22px]"
            style="background:linear-gradient(135deg,hsl(213,94%,60%),hsl(217,91%,50%),hsl(221,83%,44%));box-shadow:0 10px 20px hsla(217,91%,50%,0.4)"
        >
            <div
                class="pointer-events-none absolute inset-x-0 top-0 h-[38px]"
                style="background:linear-gradient(to bottom, hsla(0,0%,100%,0.28), hsla(0,0%,100%,0))"
            ></div>
            <Store size={34} color="white" strokeWidth={2} />
        </div>
    </div>

    <h1 class="text-2xl font-bold tracking-[-0.5px] text-foreground">Bienvenido de nuevo</h1>
    <p class="mt-1.5 text-sm text-muted-foreground">Inicia sesión para continuar</p>
</div>
