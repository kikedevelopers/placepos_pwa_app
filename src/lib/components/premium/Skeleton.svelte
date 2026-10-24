<script lang="ts">
    import { cn } from '$lib/utils'

    /** Bloque de carga con brillo sutil (respeta reduce-motion). */
    interface Props {
        class?: string
    }
    let { class: className = '' }: Props = $props()
</script>

<span aria-hidden="true" class={cn('skeleton block rounded-lg', className)}></span>
