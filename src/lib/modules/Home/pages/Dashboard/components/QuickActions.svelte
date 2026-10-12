<script lang="ts">
    import { goto } from '$app/navigation'
    import { BarChart3, Boxes, Landmark, LayoutGrid, Truck, Users, Wallet } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import ActionTile from './ActionTile.svelte'
    import { usePlaceStatus } from '$lib/modules/Place/availability'
    import PlaceButton from '$lib/modules/Place/components/PlaceButton.svelte'

    // Botón del asistente Place: solo aparece si la cuenta lo tiene habilitado
    // (companies.ai_enabled). Mismas condiciones y restricciones que en placepos.
    const placeStatus = usePlaceStatus()
    const placeEnabled = $derived($placeStatus.data?.enabled === true)
    const assistantName = $derived($placeStatus.data?.assistantName?.trim() || 'Place')

    const ACTIONS: { label: string; icon: IconComponent; route: string }[] = [
        { label: 'Reportes', icon: BarChart3, route: '/reportes' },
        { label: 'Clientes', icon: Users, route: '/clientes' },
        { label: 'Inventario', icon: Boxes, route: '/inventario' },
        { label: 'Compras', icon: Truck, route: '/compras' },
        { label: 'Billeteras', icon: Wallet, route: '/billeteras' },
        { label: 'Bancos', icon: Landmark, route: '/bancos' },
        { label: 'Catálogo', icon: LayoutGrid, route: '/catalogo' }
    ]
</script>

{#if placeEnabled}
    <div class="mb-2.5">
        <PlaceButton {assistantName} onclick={() => goto('/place')} />
    </div>
{/if}

<div class="grid grid-cols-4 gap-2.5">
    {#each ACTIONS as action (action.label)}
        <ActionTile icon={action.icon} label={action.label} onclick={() => goto(action.route)} />
    {/each}
</div>
