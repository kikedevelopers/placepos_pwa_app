<script lang="ts">
    // En web no existe Liquid Glass nativo: se usa la variante clásica (thumb con
    // bg-card + sombra), fiel a la versión Android/iOS-sin-glass de pos_app.
    interface Props {
        tabs: string[]
        value: number
        onChange: (index: number) => void
    }
    let { tabs, value, onChange }: Props = $props()
</script>

<div class="flex rounded-full bg-secondary p-1">
    {#each tabs as tab, index (tab)}
        {@const active = index === value}
        <button
            type="button"
            onclick={() => onChange(index)}
            class="flex-1 rounded-full py-2 text-xs font-semibold transition-opacity active:opacity-80 {active
                ? 'bg-card text-foreground'
                : 'text-muted-foreground'}"
            style={active ? 'box-shadow:0 2px 6px hsla(222,47%,11%,0.08)' : ''}
        >
            {tab}
        </button>
    {/each}
</div>
