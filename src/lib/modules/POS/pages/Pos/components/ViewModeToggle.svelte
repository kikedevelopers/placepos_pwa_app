<script lang="ts">
    import { LayoutGrid, List } from '@lucide/svelte'

    export type PosViewMode = 'grid' | 'list'

    interface Props {
        mode: PosViewMode
        onChange: (mode: PosViewMode) => void
    }
    let { mode, onChange }: Props = $props()

    const ACTIVE = 'hsl(217, 91%, 50%)'
    const INACTIVE = 'hsl(215, 16%, 47%)'
</script>

<div
    class="flex shrink-0 items-center gap-1 rounded-[14px] border border-border p-1"
    style="background-color: hsl(210, 40%, 96%)"
    role="group"
    aria-label="Modo de vista de productos"
>
    <button
        type="button"
        onclick={() => onChange('grid')}
        aria-label="Vista de cuadros"
        aria-pressed={mode === 'grid'}
        class="flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors {mode ===
        'grid'
            ? 'bg-card shadow-sm'
            : ''}"
    >
        <LayoutGrid size={18} color={mode === 'grid' ? ACTIVE : INACTIVE} strokeWidth={2} />
    </button>
    <button
        type="button"
        onclick={() => onChange('list')}
        aria-label="Vista de lista"
        aria-pressed={mode === 'list'}
        class="flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors {mode ===
        'list'
            ? 'bg-card shadow-sm'
            : ''}"
    >
        <List size={18} color={mode === 'list' ? ACTIVE : INACTIVE} strokeWidth={2} />
    </button>
</div>
