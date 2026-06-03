<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'

    /**
     * Botón-pill compacto para la barra de filtros (abre un sheet). Muestra
     * icono + label y, opcionalmente, un badge con el nº de filtros activos o
     * un estado "activo" resaltado (p. ej. el chip del rango).
     */
    interface Props {
        icon: IconComponent
        label: string
        onclick: () => void
        badge?: number
        active?: boolean
    }
    let { icon: Icon, label, onclick, badge, active = false }: Props = $props()
</script>

<button
    type="button"
    {onclick}
    class="flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-opacity active:opacity-80 {active
        ? 'border-transparent bg-[hsla(217,91%,50%,0.12)] text-[hsl(217,91%,50%)]'
        : 'border-border bg-card text-muted-foreground'}"
>
    <Icon size={14} color={active ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 47%)'} strokeWidth={2} />
    {label}
    {#if badge}
        <span
            class="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style="background-color: hsl(217, 91%, 50%)"
        >
            {badge}
        </span>
    {/if}
</button>
