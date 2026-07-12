<script lang="ts">
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'

    interface Props {
        label: string
        description?: string
        value: boolean
        onValueChange: (value: boolean) => void
    }
    let { label, description, value, onValueChange }: Props = $props()
</script>

<div class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
    <div class="flex-1 pr-3">
        <p class="text-sm font-medium text-foreground">{label}</p>
        {#if description}
            <p class="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
        {/if}
    </div>
    <!-- Switch CANÓNICO (mismo diseño que el resto de la app): la perilla se
         ancla con `left` explícito dentro de un track h-7/w-12. Antes SwitchRow
         tenía markup propio con `transform:translateX()` SIN `left`, cuya
         posición base quedaba indeterminada → la perilla se desfasaba/desbordaba
         por la derecha en el estado activo. -->
    <ToggleSwitch variant="bare" checked={value} onChange={onValueChange} ariaLabel={label} />
</div>
