<script lang="ts">
    import { FileText, ImageIcon, Loader2, RotateCcw, TriangleAlert, X } from '@lucide/svelte'
    import { formatFileSize, isPdfMime } from '$lib/modules/Place/lib/attachments'
    import type { DraftAttachment } from '$lib/modules/Place/store/attachment-draft.svelte'

    /**
     * Archivo en la caja de texto antes de enviar: miniatura (o ícono PDF),
     * nombre, tamaño y estado (reduciendo / subiendo / listo / error).
     */
    interface Props {
        item: DraftAttachment
        can_retry: boolean
        onretry: () => void
        onremove: () => void
    }
    let { item, can_retry, onretry, onremove }: Props = $props()

    const is_pdf = $derived(isPdfMime(item.mime_type))
    const is_working = $derived(item.status === 'processing' || item.status === 'uploading')
    const status_label = $derived(
        item.status === 'processing'
            ? 'Preparando…'
            : item.status === 'uploading'
              ? 'Subiendo…'
              : item.status === 'error'
                ? (item.error ?? 'No se pudo subir')
                : formatFileSize(item.size_bytes)
    )
</script>

<div
    class="relative flex w-[172px] shrink-0 items-center gap-2 rounded-2xl border bg-background/80 p-1.5 pr-7 {item.status ===
    'error'
        ? 'border-destructive/40'
        : 'border-border/70'}"
    title={item.file_name}
>
    <div
        class="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl {is_pdf
            ? 'bg-red-500/10 text-red-600'
            : 'bg-primary/10 text-primary'}"
    >
        {#if item.thumbnail_data_url}
            <img src={item.thumbnail_data_url} alt="" class="size-full object-cover" />
        {:else if is_pdf}
            <FileText class="size-[18px]" />
        {:else}
            <ImageIcon class="size-[18px]" />
        {/if}
        {#if is_working}
            <span class="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                <Loader2 class="size-4 animate-spin" />
            </span>
        {/if}
    </div>

    <div class="min-w-0 flex-1 leading-tight">
        <p class="truncate text-[12px] font-medium text-foreground">{item.file_name}</p>
        {#if item.status === 'error'}
            <p class="flex items-center gap-1 text-[10.5px] text-destructive">
                <TriangleAlert class="size-3 shrink-0" />
                <span class="truncate" title={status_label}>{status_label}</span>
            </p>
            {#if can_retry}
                <button
                    type="button"
                    onclick={onretry}
                    class="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-primary active:opacity-70"
                >
                    <RotateCcw class="size-3" />Reintentar
                </button>
            {/if}
        {:else}
            <p class="truncate text-[10.5px] tabular-nums text-muted-foreground">{status_label}</p>
        {/if}
    </div>

    <button
        type="button"
        onclick={onremove}
        aria-label="Quitar {item.file_name}"
        class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-90"
    >
        <X class="size-3" />
    </button>
</div>
