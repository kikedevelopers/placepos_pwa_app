<script lang="ts">
    import { goto } from '$app/navigation'
    import { BarChart3, Boxes, Landmark, Truck, Users, Wallet } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import ActionTile from './ActionTile.svelte'

    const ACTIONS: { label: string; icon: IconComponent; route: string }[] = [
        { label: 'Reportes', icon: BarChart3, route: '/reportes' },
        { label: 'Clientes', icon: Users, route: '/clientes' },
        { label: 'Inventario', icon: Boxes, route: '/inventario' },
        { label: 'Compras', icon: Truck, route: '/compras' },
        { label: 'Billeteras', icon: Wallet, route: '/billeteras' },
        { label: 'Bancos', icon: Landmark, route: '/bancos' }
    ]
</script>

<div class="grid grid-cols-3 gap-3">
    {#each ACTIONS as action (action.label)}
        <ActionTile icon={action.icon} label={action.label} onclick={() => goto(action.route)} />
    {/each}
</div>
