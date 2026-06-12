<script lang="ts">
    import { BellRing, Building2, Palette, Store, UserRound } from '@lucide/svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import SettingRow from '$lib/components/SettingRow.svelte'
    import type { SettingsView } from '../types'

    let { onOpen }: { onOpen: (view: SettingsView) => void } = $props()

    const role = useUserRole()
    const isOwner = $derived(role.role === 'owner')
</script>

<header class="relative overflow-hidden px-5 pb-4 pt-5">
    <div
        class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-60 blur-2xl"
        style="background: radial-gradient(circle, hsla(217,91%,50%,0.18), transparent 70%)"
        aria-hidden="true"
    ></div>
    <h1 class="text-2xl font-bold tracking-tight text-foreground">Configuración</h1>
    <p class="mt-0.5 text-sm text-muted-foreground">
        Administra la configuración general del sistema
    </p>
</header>

<div class="flex flex-col gap-2.5 px-5 pb-8">
    {#if isOwner}
        <FadeInUp index={0}>
            <SettingRow
                icon={UserRound}
                label="Mi cuenta"
                subtitle="Datos personales y seguridad"
                onclick={() => onOpen('account')}
            />
        </FadeInUp>
    {/if}
    <FadeInUp index={1}>
        <SettingRow
            icon={Building2}
            label="Mi negocio"
            subtitle="Datos, punto de equilibrio y consecutivos"
            onclick={() => onOpen('business')}
        />
    </FadeInUp>
    <FadeInUp index={2}>
        <SettingRow
            icon={Store}
            label="P.O.S"
            subtitle="Márgenes y control de inventario"
            tone="success"
            onclick={() => onOpen('pos')}
        />
    </FadeInUp>
    <FadeInUp index={3}>
        <SettingRow
            icon={BellRing}
            label="Alertas"
            subtitle="Notificaciones automáticas"
            tone="warning"
            onclick={() => onOpen('alerts')}
        />
    </FadeInUp>
    <FadeInUp index={4}>
        <SettingRow
            icon={Palette}
            label="Tema"
            subtitle="Apariencia de la aplicación"
            tone="muted"
            onclick={() => onOpen('theme')}
        />
    </FadeInUp>
</div>
