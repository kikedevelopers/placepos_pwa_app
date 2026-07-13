<script lang="ts">
    import { Layers, Package } from '@lucide/svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'

    /**
     * Menú del botón "+" del inventario: dos acciones (Crear producto | Crear
     * presentación), espejo de los botones "Nuevo Producto" / "Nueva
     * Presentación" de placepos, adaptado a mobile (bottom sheet, mismo patrón
     * que BranchSwitcher).
     */
    interface Props {
        open: boolean
        onClose: () => void
        onCreateProduct: () => void
        onCreatePresentation: () => void
    }
    let { open, onClose, onCreateProduct, onCreatePresentation }: Props = $props()
</script>

<BottomSheet {open} title="Crear" {onClose}>
    <div class="flex flex-col gap-1.5 pb-2">
        <button
            type="button"
            onclick={onCreateProduct}
            class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left active:bg-secondary"
        >
            <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style="background-color:hsla(217, 91%, 50%, 0.12)"
            >
                <Package size={20} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </span>
            <span class="min-w-0">
                <span class="block text-sm font-semibold text-foreground">Crear producto</span>
                <span class="block text-[11px] text-muted-foreground"
                    >Producto base de tu inventario</span
                >
            </span>
        </button>

        <button
            type="button"
            onclick={onCreatePresentation}
            class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left active:bg-secondary"
        >
            <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style="background-color:hsla(158, 64%, 38%, 0.12)"
            >
                <Layers size={20} color="hsl(158, 64%, 38%)" strokeWidth={2} />
            </span>
            <span class="min-w-0">
                <span class="block text-sm font-semibold text-foreground">Crear presentación</span>
                <span class="block text-[11px] text-muted-foreground"
                    >Variante de un producto base</span
                >
            </span>
        </button>
    </div>
</BottomSheet>
