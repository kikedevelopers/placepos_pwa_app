<script lang="ts">
    import { ArrowRightLeft, Pencil, Scale } from '@lucide/svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        /** owner/manager: puede mover saldo y editar. */
        canManage: boolean
        /** owner: puede corregir caja (ajuste de saldo). */
        canAdjust: boolean
        onTransfer: () => void
        onAdjust: () => void
        onEdit: () => void
    }
    let { canManage, canAdjust, onTransfer, onAdjust, onEdit }: Props = $props()
</script>

<div class="flex flex-wrap gap-2.5">
    {#if canManage}
        <PressableScale
            onclick={onTransfer}
            class="min-w-[8rem] flex-1"
            ariaLabel="Mover saldo"
        >
            <span
                class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground"
            >
                <ArrowRightLeft size={16} color="hsl(217, 91%, 50%)" strokeWidth={2.2} />
                Mover saldo
            </span>
        </PressableScale>
    {/if}

    {#if canAdjust}
        <PressableScale
            onclick={onAdjust}
            class="min-w-[8rem] flex-1"
            ariaLabel="Corregir caja"
        >
            <span
                class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground"
            >
                <Scale size={16} color="hsl(215, 16%, 47%)" strokeWidth={2.2} />
                Corregir caja
            </span>
        </PressableScale>
    {/if}

    {#if canManage}
        <PressableScale onclick={onEdit} class="min-w-[8rem] flex-1" ariaLabel="Editar cuenta">
            <span
                class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground"
            >
                <Pencil size={15} color="hsl(215, 16%, 47%)" strokeWidth={2.2} />
                Editar
            </span>
        </PressableScale>
    {/if}
</div>
