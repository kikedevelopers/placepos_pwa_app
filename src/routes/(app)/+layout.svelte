<script lang="ts">
    import type { Snippet } from 'svelte'
    import { fromStore } from 'svelte/store'
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import AppHeader from '$lib/components/AppHeader.svelte'
    import AppTabBar from '$lib/components/AppTabBar.svelte'
    import BranchGuardGate from '$lib/components/BranchGuardGate.svelte'
    import SubscriptionExpiredModal from '$lib/components/SubscriptionExpiredModal.svelte'
    import { TicketViewerHost } from '$lib/components/TicketViewer'
    import ChargeHost from '$lib/components/ChargeHost.svelte'
    import SplashScreen from '$lib/components/SplashScreen.svelte'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { resolveLanding, shouldGateAppShell } from '$lib/permissions/landing'

    let { children }: { children: Snippet } = $props()

    // Landing por rol (RBAC), espejo de `useEmployeeRedirect` de placepos: un
    // usuario que NO es owner (type==='employee') que cae en el dashboard por
    // defecto (/) entra directamente al informe de Ventas (/reportes). owner/
    // superadmin quedan en el dashboard. Idempotente vía `landed`.
    const permissions = usePermissions()
    const profileQuery = fromStore(useProfile())

    let landed = $state(false)
    $effect(() => {
        if (landed) return
        const type = permissions.userType
        if (!type) return // rol aún no resuelto: esperar (no decidir en falso).
        landed = true
        const target = resolveLanding(type, page.url.pathname)
        if (target) {
            goto(target, { replaceState: true })
        }
    })

    // Anti-parpadeo (espejo del loader "Cargando perfil…" de placepos): no se
    // pinta el app-shell hasta que el perfil (rol + permisos) resolvió y, si es
    // un empleado en '/', hasta que la redirección al informe de ventas se
    // completó. Así un empleado NUNCA ve el dashboard ni dispara sus queries.
    const profileSettled = $derived(
        profileQuery.current.isSuccess || profileQuery.current.isError
    )
    const gated = $derived(
        shouldGateAppShell({
            profileSettled,
            type: permissions.userType,
            pathname: page.url.pathname
        })
    )
</script>

{#if gated}
    <SplashScreen />
{:else}
    <!--
        App-shell de altura fija = viewport (h-[100dvh]) con scroll SOLO en <main>.
        Así el header queda anclado arriba y el AppTabBar siempre fijo al fondo del
        viewport, sin importar cuánto crezca el contenido (incluido scroll infinito).
        `overflow-hidden` en el shell evita que el body scrollee; `min-h-0` en main
        es imprescindible para que el área scrolleable pueda encogerse en flexbox.
    -->
    <div class="flex h-[100dvh] flex-col overflow-hidden bg-background">
        <AppHeader />
        <main class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {@render children()}
        </main>
        <AppTabBar />
        <TicketViewerHost />
        <!-- Host global de cobro: PaymentModal sobre el TicketViewer (Reportes). -->
        <ChargeHost />
        <!-- Multi-sucursal: auto-switch al principal y modal bloqueante de
             reconciliación cuando el admin cambia el gating. -->
        <BranchGuardGate />
        <!-- Bloqueo total por suscripción vencida (cloud, ante 402). -->
        <SubscriptionExpiredModal />
    </div>
{/if}
