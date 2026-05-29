<script lang="ts">
    import type { Snippet } from 'svelte'
    import { onMount } from 'svelte'
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { getAuthToken } from '$lib/api/storage'
    import { auth } from '$lib/stores/auth.svelte'
    import { theme } from '$lib/stores/theme.svelte'
    import Spinner from '$lib/components/Spinner.svelte'

    let { children }: { children: Snippet } = $props()

    // Hidrata el token guardado al arrancar. Hasta que `isHydrated` es true no se
    // renderiza nada navegable: evita el parpadeo login↔app.
    onMount(async () => {
        theme.hydrate()
        const stored = await getAuthToken()
        auth.setToken(stored)
        auth.setHydrated(true)
    })

    // Redirección equivalente al AuthGate de pos_app. En SvelteKit los grupos de
    // ruta no aparecen en la URL, así que detectamos por pathname: /login = auth.
    $effect(() => {
        if (!auth.isHydrated) return
        const path = page.url.pathname
        const inAuth = path.startsWith('/login')
        if (!auth.token && !inAuth) {
            goto('/login', { replaceState: true })
        } else if (auth.token && inAuth) {
            goto('/', { replaceState: true })
        }
    })
</script>

{#if auth.isHydrated}
    {@render children()}
{:else}
    <div class="flex min-h-[100dvh] items-center justify-center bg-background">
        <Spinner />
    </div>
{/if}
