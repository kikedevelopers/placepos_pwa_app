<script lang="ts">
    import type { Snippet } from 'svelte'
    import AppHeader from '$lib/components/AppHeader.svelte'
    import AppTabBar from '$lib/components/AppTabBar.svelte'
    import { TicketViewerHost } from '$lib/components/TicketViewer'

    let { children }: { children: Snippet } = $props()
</script>

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
</div>
