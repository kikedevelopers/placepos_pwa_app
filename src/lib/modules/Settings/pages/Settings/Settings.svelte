<script lang="ts">
    import SettingsHome from './components/SettingsHome.svelte'
    import AccountSection from './components/AccountSection.svelte'
    import BusinessSection from './components/BusinessSection.svelte'
    import PosSection from './components/PosSection.svelte'
    import AlertsSection from './components/AlertsSection.svelte'
    import ThemeSection from './components/ThemeSection.svelte'
    import type { SettingsView } from './types'

    // Navegación interna por estado (patrón del repo: no se crean sub-rutas).
    let view = $state<SettingsView>('home')
    const goHome = () => (view = 'home')
</script>

<div class="flex flex-1 flex-col">
    {#if view === 'home'}
        <SettingsHome onOpen={(v) => (view = v)} />
    {:else if view === 'account'}
        <AccountSection onBack={goHome} />
    {:else if view === 'business'}
        <BusinessSection onBack={goHome} />
    {:else if view === 'pos'}
        <PosSection onBack={goHome} />
    {:else if view === 'alerts'}
        <AlertsSection onBack={goHome} />
    {:else if view === 'theme'}
        <ThemeSection onBack={goHome} />
    {/if}
</div>
