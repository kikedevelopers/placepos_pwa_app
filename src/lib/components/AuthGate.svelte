<script lang="ts">
    import type { Snippet } from 'svelte'
    import { onMount } from 'svelte'
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { getAuthToken } from '$lib/api/storage'
    import { auth } from '$lib/stores/auth.svelte'
    import { theme } from '$lib/stores/theme.svelte'
    import SplashScreen from '$lib/components/SplashScreen.svelte'

    let { children }: { children: Snippet } = $props()

    // Hidrata el token guardado al arrancar. Hasta que `isHydrated` es true no se
    // renderiza nada navegable: evita el parpadeo login↔app.
    onMount(async () => {
        theme.hydrate()
        const stored = await getAuthToken()
        auth.setToken(stored)
        auth.setHydrated(true)
    })

    // Estado de ruta vs. autenticación. En SvelteKit los grupos de ruta no
    // aparecen en la URL, así que detectamos por pathname: /login = auth.
    const inAuth = $derived(page.url.pathname.startsWith('/login'))

    // ¿Estamos a punto de redirigir? Mientras la ruta NO coincida con el estado
    // de auth, la decisión sigue pendiente: un usuario sin token en una ruta de
    // la app, o uno con token parado en /login. En esa ventana NO debemos pintar
    // `children` (pintaría el dashboard/login equivocado un frame antes del
    // goto), por eso seguimos mostrando el splash hasta que la ruta cuadre.
    const redirectPending = $derived(
        auth.isHydrated && ((!auth.token && !inAuth) || (!!auth.token && inAuth))
    )

    // Solo cuando el token está hidratado y la ruta ya corresponde al estado de
    // auth se considera resuelto qué mostrar.
    const resolved = $derived(auth.isHydrated && !redirectPending)

    // Redirección equivalente al AuthGate de pos_app.
    $effect(() => {
        if (!auth.isHydrated) return
        if (!auth.token && !inAuth) {
            goto('/login', { replaceState: true })
        } else if (auth.token && inAuth) {
            goto('/', { replaceState: true })
        }
    })
</script>

{#if resolved}
    {@render children()}
{:else}
    <SplashScreen />
{/if}
