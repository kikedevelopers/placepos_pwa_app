<script lang="ts">
    /**
     * Chips de sección scrolleables horizontalmente (Ventas y Créditos ·
     * Comparativa · Finanzas · Cajeros · Clientes). El activo va relleno en
     * primary; los demás como pill con borde. Snap + scroll suave en mobile.
     */
    interface Props {
        tabs: readonly string[]
        value: number
        onChange: (index: number) => void
    }
    let { tabs, value, onChange }: Props = $props()
</script>

<div class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {#each tabs as tab, index (tab)}
        {@const active = index === value}
        <button
            type="button"
            onclick={() => onChange(index)}
            class="shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-opacity active:opacity-80 {active
                ? 'border-transparent text-white'
                : 'border-border bg-card text-muted-foreground'}"
            style={active ? 'background-color: hsl(217, 91%, 50%); box-shadow:0 4px 10px hsla(217,91%,50%,0.28)' : ''}
        >
            {tab}
        </button>
    {/each}
</div>
