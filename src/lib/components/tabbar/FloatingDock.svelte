<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { ShoppingCart } from '@lucide/svelte'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { ACTIVE, INACTIVE, filterTabs, isTabActive, type Tab } from './config'

    const pathname = $derived(page.url.pathname)

    // Respuesta háptica breve al cambiar de pestaña (Android; iOS no expone
    // vibración a la web y simplemente no hace nada).
    const go = (route: string) => {
        if (route !== pathname) navigator.vibrate?.(8)
        goto(route, { replaceState: true })
    }

    // Gating RBAC: las tabs se ocultan según los permisos efectivos y el dock
    // se reacomoda. Sin POS, las tabs restantes van en una fila plana.
    const permissions = usePermissions()
    const visible = $derived(filterTabs((key) => permissions.can(key)))
    const flatTabs = $derived(visible.showPos ? [] : [...visible.left, ...visible.right])
</script>

{#snippet tabItem(tab: Tab)}
    {@const active = isTabActive(tab, pathname)}
    <button
        type="button"
        onclick={() => go(tab.route)}
        aria-current={active ? 'page' : undefined}
        class="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[18px] py-1.5 transition-[transform,background-color] duration-100 ease-out active:scale-[0.94] {active
            ? 'bg-primary/10'
            : 'active:bg-black/[0.04]'}"
    >
        <tab.icon size={21} color={active ? ACTIVE : INACTIVE} strokeWidth={active ? 2.3 : 1.9} />
        <span
            class="truncate text-[10.5px] tracking-[0.01em] {active ? 'font-semibold' : 'font-medium'}"
            style="color:{active ? ACTIVE : INACTIVE}"
        >
            {tab.label}
        </span>
    </button>
{/snippet}

<!--
    Dock flotante: una cápsula de material translúcido separada de los bordes;
    el contenido pasa por detrás desenfocado (no consume una franja opaca). El
    `nav` exterior no captura toques: solo la cápsula los recibe.
-->
<nav
    aria-label="Navegación principal"
    class="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4"
    style="padding-bottom:max(env(safe-area-inset-bottom), 12px)"
>
    <div
        class="dock-material pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-[28px] p-1.5"
    >
        {#if visible.showPos}
            {#each visible.left as tab (tab.match)}
                {@render tabItem(tab)}
            {/each}

            <button
                type="button"
                aria-label="Punto de venta (POS)"
                onclick={() => go('/pos')}
                class="mx-1 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full transition-transform duration-100 ease-out active:scale-[0.92]"
                style="background:linear-gradient(160deg,hsl(213,94%,58%),hsl(221,83%,46%));box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 8px 18px -6px hsla(217,91%,45%,0.55)"
            >
                <ShoppingCart size={23} color="white" strokeWidth={2.2} />
            </button>

            {#each visible.right as tab (tab.match)}
                {@render tabItem(tab)}
            {/each}
        {:else}
            {#each flatTabs as tab (tab.match)}
                {@render tabItem(tab)}
            {/each}
        {/if}
    </div>
</nav>

<style>
    /*
     * Material translúcido (Apple): fondo semitransparente + desenfoque con
     * saturación, borde superior brillante (luz sobre el material) y sombra
     * profunda porque es una superficie grande que flota sobre el contenido.
     */
    .dock-material {
        background: rgba(255, 255, 255, 0.74);
        -webkit-backdrop-filter: blur(22px) saturate(180%);
        backdrop-filter: blur(22px) saturate(180%);
        border: 1px solid rgba(15, 23, 42, 0.06);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            0 12px 32px -10px rgba(15, 23, 42, 0.28),
            0 2px 6px rgba(15, 23, 42, 0.06);
    }

    /* Sin desenfoque disponible: material casi opaco para mantener legibilidad. */
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .dock-material {
            background: rgba(255, 255, 255, 0.97);
        }
    }
</style>
