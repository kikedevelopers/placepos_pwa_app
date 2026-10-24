<script lang="ts">
    import Skeleton from './Skeleton.svelte'

    /** Placeholder de un listado mientras carga: misma forma que las filas reales. */
    interface Props {
        rows?: number
    }
    let { rows = 5 }: Props = $props()
</script>

<div class="surface group-rows overflow-hidden" aria-busy="true" aria-label="Cargando">
    {#each Array.from({ length: rows }, (_, i) => i) as i (i)}
        <div class="row flex items-center gap-3 px-4 py-3.5">
            <Skeleton class="h-9 w-9 rounded-[11px]" />
            <div class="flex-1 space-y-2">
                <Skeleton class="h-3.5 w-2/5" />
                <Skeleton class="h-3 w-1/4" />
            </div>
            <Skeleton class="h-4 w-16" />
        </div>
    {/each}
</div>
