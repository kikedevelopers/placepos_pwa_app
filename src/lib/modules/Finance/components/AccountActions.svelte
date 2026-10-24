<script lang="ts">
    import { ArrowRightLeft, Pencil, Scale } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'

    /**
     * Acciones rápidas de la cuenta como botones circulares con etiqueta, al
     * estilo de las acciones de iOS. Cada una aparece solo si el rol la permite.
     */
    interface Props {
        /** owner/manager: puede mover saldo y editar. */
        canManage: boolean
        /** owner: puede corregir el saldo (ajuste). */
        canAdjust: boolean
        onTransfer: () => void
        onAdjust: () => void
        onEdit: () => void
    }
    let { canManage, canAdjust, onTransfer, onAdjust, onEdit }: Props = $props()

    const actions = $derived(
        [
            canManage && { label: 'Mover saldo', icon: ArrowRightLeft, run: onTransfer, primary: true },
            canAdjust && { label: 'Corregir', icon: Scale, run: onAdjust, primary: false },
            canManage && { label: 'Editar', icon: Pencil, run: onEdit, primary: false }
        ].filter(Boolean) as { label: string; icon: IconComponent; run: () => void; primary: boolean }[]
    )
</script>

{#if actions.length > 0}
    <div class="flex justify-around gap-2 px-2">
        {#each actions as action (action.label)}
            <button
                type="button"
                onclick={action.run}
                class="group flex w-20 flex-col items-center gap-1.5 transition-transform duration-150 ease-out active:scale-[0.94]"
            >
                <span
                    class="flex h-[52px] w-[52px] items-center justify-center rounded-full {action.primary
                        ? 'bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.8)]'
                        : 'surface text-foreground'}"
                >
                    <action.icon size={20} strokeWidth={2.1} />
                </span>
                <span class="text-[12px] font-medium text-foreground">{action.label}</span>
            </button>
        {/each}
    </div>
{/if}
