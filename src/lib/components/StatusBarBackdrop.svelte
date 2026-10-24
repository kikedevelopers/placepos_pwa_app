<script lang="ts">
    import { STATUS_BAR_COLOR } from '$lib/theme/statusBar'
</script>

<!--
    Franja de color detrás del reloj y la batería, fija y por ENCIMA de todo
    (también de modales a pantalla completa). Con la app dibujándose bajo la
    barra de estado, iOS pinta la hora en blanco: esta franja garantiza que se
    lea en cualquier pantalla. Mide --app-safe-top (app.css): en navegador de
    escritorio vale 0 y no existe.
-->
<div
    aria-hidden="true"
    data-testid="status-bar-backdrop"
    class="pointer-events-none fixed inset-x-0 top-0 z-[2147483000] h-[var(--app-safe-top)]"
    style="background-color:{STATUS_BAR_COLOR}"
></div>
