<script lang="ts">
    import { CalendarClock, Plus } from '@lucide/svelte'
    import { EmptyState } from '$lib/components/premium'

    interface Props {
        /** Solo se muestra el botón si el usuario puede gestionar. */
        canManage: boolean
        onCreate: () => void
    }
    let { canManage, onCreate }: Props = $props()
</script>

<EmptyState
    icon={CalendarClock}
    title="Aún no tienes gastos fijos"
    message="Registra lo que cuesta el negocio cada periodo (arriendo, servicios, salarios) y verás cómo se acumula en tiempo real."
>
    {#snippet action()}
        {#if canManage}
            <button
                type="button"
                onclick={onCreate}
                class="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.96]"
            >
                <Plus size={17} strokeWidth={2.5} />
                Crear gasto fijo
            </button>
        {/if}
    {/snippet}
</EmptyState>
