<script lang="ts">
    import { Check } from '@lucide/svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { conceptLabel } from '../constants/concepts'

    interface Props {
        open: boolean
        /** Conceptos presentes en los movimientos del periodo (opciones). */
        available: string[]
        /** Conceptos seleccionados (vacío = todos). */
        selected: string[]
        onChange: (next: string[]) => void
        onClose: () => void
    }
    let { open, available, selected, onChange, onClose }: Props = $props()

    const toggle = (concept: string) => {
        onChange(
            selected.includes(concept)
                ? selected.filter((c) => c !== concept)
                : [...selected, concept]
        )
    }
</script>

{#if open}
    <BottomSheet {open} title="Tipo de movimiento" {onClose}>
        <div class="flex flex-col gap-1 pb-1">
            <p class="mb-1 text-xs text-muted-foreground">
                Selecciona uno o más tipos para filtrar la lista.
            </p>
            {#each available as concept (concept)}
                {@const checked = selected.includes(concept)}
                <button
                    type="button"
                    onclick={() => toggle(concept)}
                    class="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors active:bg-muted/60"
                >
                    <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border {checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border'}"
                    >
                        {#if checked}
                            <Check size={14} strokeWidth={3} />
                        {/if}
                    </span>
                    <span class="text-sm font-medium text-foreground">{conceptLabel(concept)}</span>
                </button>
            {/each}
        </div>

        {#snippet footer()}
            <div class="flex items-center gap-3">
                {#if selected.length > 0}
                    <button
                        type="button"
                        onclick={() => onChange([])}
                        class="h-12 shrink-0 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors active:bg-muted/60"
                    >
                        Limpiar
                    </button>
                {/if}
                <div class="flex-1">
                    <PrimaryButton label="Listo" onclick={onClose} />
                </div>
            </div>
        {/snippet}
    </BottomSheet>
{/if}
