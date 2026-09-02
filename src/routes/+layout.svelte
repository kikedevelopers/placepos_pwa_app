<script lang="ts">
    import '../app.css'
    import type { Snippet } from 'svelte'
    import { QueryClientProvider } from '@tanstack/svelte-query'
    import { Toaster } from 'svelte-sonner'
    import { queryClient } from '$lib/api/queryClient'
    import AuthGate from '$lib/components/AuthGate.svelte'
    import { useRealtimeInvalidation } from '$lib/realtime/useRealtimeInvalidation.svelte'

    let { children }: { children: Snippet } = $props()

    // Tiempo real (Socket.IO): conexión única para toda la app. Montada en la
    // raíz para sobrevivir la navegación entre `(app)` y el POS inmersivo `/pos`.
    useRealtimeInvalidation()
</script>

<QueryClientProvider client={queryClient}>
    <AuthGate>
        {@render children()}
    </AuthGate>
    <!-- `top-center`: la barra de tabs vive fija abajo, un toast ahí chocaría
         con ella. `richColors` para que warning/error se distingan a simple
         vista sin depender solo del ícono. -->
    <Toaster position="top-center" richColors closeButton />
</QueryClientProvider>
