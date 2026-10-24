<script lang="ts">
    import '../app.css'
    import { onMount } from 'svelte'
    import type { Snippet } from 'svelte'
    import { QueryClientProvider } from '@tanstack/svelte-query'
    import { Toaster } from 'svelte-sonner'
    import { queryClient } from '$lib/api/queryClient'
    import AuthGate from '$lib/components/AuthGate.svelte'
    import StatusBarBackdrop from '$lib/components/StatusBarBackdrop.svelte'
    import { useRealtimeInvalidation } from '$lib/realtime/useRealtimeInvalidation.svelte'

    let { children }: { children: Snippet } = $props()

    // Tiempo real (Socket.IO): conexión única para toda la app. Montada en la
    // raíz para sobrevivir la navegación entre `(app)` y el POS inmersivo `/pos`.
    useRealtimeInvalidation()

    // Registro del service worker (lo genera vite-plugin-pwa en /sw.js). Sin él,
    // Chrome en Android no considera la app instalable (requiere SW + manifest).
    // En dev el SW está deshabilitado (devOptions.enabled:false), así que esto
    // solo corre en el build servido por HTTPS. autoUpdate ya hace skipWaiting.
    onMount(() => {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
                // Sin SW la app sigue funcionando; solo se pierde instalar/offline.
            })
        }
    })
</script>

<!-- Color detrás del reloj/batería en TODAS las pantallas (ver statusBar.ts). -->
<StatusBarBackdrop />

<QueryClientProvider client={queryClient}>
    <AuthGate>
        {@render children()}
    </AuthGate>
    <!-- `top-center`: la barra de tabs vive fija abajo, un toast ahí chocaría
         con ella. `richColors` para que warning/error se distingan a simple
         vista sin depender solo del ícono. -->
    <Toaster position="top-center" richColors closeButton />
</QueryClientProvider>
