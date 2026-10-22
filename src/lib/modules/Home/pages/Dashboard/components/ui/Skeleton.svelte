<script lang="ts">
    import { cn } from '$lib/utils'
    let { class: className = '' }: { class?: string } = $props()
</script>

<!-- Bloque de carga con la forma del contenido: sin saltos de layout. -->
<div aria-hidden="true" class={cn('animate-pulse rounded-md bg-muted', className)}></div>
