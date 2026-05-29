<script lang="ts">
    let { size = 22, color = 'hsl(217 91% 50%)' }: { size?: number; color?: string } = $props()
</script>

<span
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    style="width:{size}px;height:{size}px;color:{color}"
    role="status"
    aria-label="Cargando"
></span>
