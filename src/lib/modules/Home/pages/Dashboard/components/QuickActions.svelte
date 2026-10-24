<script lang="ts">
    import { goto } from '$app/navigation'
    import { QUICK_ACTIONS as ACTIONS } from '../quickActions'
    import { usePlaceStatus } from '$lib/modules/Place/availability'
    import PlaceButton from '$lib/modules/Place/components/PlaceButton.svelte'

    // Botón del asistente Place: solo aparece si la cuenta lo tiene habilitado
    // (companies.ai_enabled). Mismas condiciones y restricciones que en placepos.
    const placeStatus = usePlaceStatus()
    const placeEnabled = $derived($placeStatus.data?.enabled === true)
    const assistantName = $derived($placeStatus.data?.assistantName?.trim() || 'Place')

</script>

{#if placeEnabled}
    <PlaceButton {assistantName} onclick={() => goto('/place')} />
{/if}

<!--
    Accesos como en la pantalla de inicio de un teléfono: una sola superficie con
    iconos, sin una tarjeta por acción.
-->
<nav aria-label="Accesos rápidos" class="dash-card rounded-[22px] border border-border/70 bg-card px-2 py-3">
    <ul class="grid grid-cols-3 gap-y-2 md:grid-cols-6">
        {#each ACTIONS as action (action.label)}
            {@const Icon = action.icon}
            <li>
                <button
                    type="button"
                    onclick={() => goto(action.route)}
                    class="group flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-2 outline-none transition-transform duration-150 ease-out-strong active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                    <span
                        class="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary transition-colors duration-150 group-hover:bg-primary/15"
                    >
                        <Icon size={20} strokeWidth={1.9} />
                    </span>
                    <span class="max-w-full truncate text-[11.5px] font-medium text-foreground">{action.label}</span>
                </button>
            </li>
        {/each}
    </ul>
</nav>
