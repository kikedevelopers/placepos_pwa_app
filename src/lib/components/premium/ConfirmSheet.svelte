<script lang="ts">
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import Spinner from '$lib/components/Spinner.svelte'
    import { cn } from '$lib/utils'

    /**
     * Confirmación de una acción (reemplaza `window.confirm`/`alert`, que rompen
     * el estilo y bloquean la app). La acción destructiva va en rojo; si falla,
     * el error se muestra AQUÍ, sin cerrar, para poder reintentar.
     */
    interface Props {
        open: boolean
        title: string
        message: string
        confirmLabel: string
        destructive?: boolean
        loading?: boolean
        error?: string | null
        onConfirm: () => void
        onClose: () => void
    }
    let {
        open,
        title,
        message,
        confirmLabel,
        destructive = false,
        loading = false,
        error = null,
        onConfirm,
        onClose
    }: Props = $props()
</script>

<BottomSheet {open} {title} {onClose}>
    <div class="flex flex-col gap-4 pb-1">
        <p class="text-[15px] leading-relaxed text-muted-foreground">{message}</p>
        {#if error}
            <p role="alert" class="rounded-[14px] bg-destructive/10 px-4 py-3 text-[13.5px] font-medium text-destructive">
                {error}
            </p>
        {/if}
        <div class="flex flex-col gap-2">
            <button
                type="button"
                onclick={onConfirm}
                disabled={loading}
                class={cn(
                    'flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] text-[15.5px] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-70',
                    destructive ? 'bg-destructive' : 'bg-primary'
                )}
            >
                {#if loading}<Spinner size={18} color="white" />{/if}
                {confirmLabel}
            </button>
            <button
                type="button"
                onclick={onClose}
                disabled={loading}
                class="h-[48px] w-full rounded-[16px] text-[15px] font-semibold text-foreground transition-colors active:bg-foreground/[0.05]"
            >
                Cancelar
            </button>
        </div>
    </div>
</BottomSheet>
