<script lang="ts">
    import { Clock, FileText, ImageIcon } from '@lucide/svelte'
    import {
        formatFileSize,
        isAttachmentExpired,
        isPdfMime,
        type ChatAttachment
    } from '$lib/modules/Place/lib/attachments'

    /**
     * Adjuntos de un mensaje del usuario (del historial). Solo se tiene la
     * miniatura: el archivo vive 47 h en el servidor; pasado ese plazo se
     * marca "Vencido" (Place ya no puede leerlo).
     */
    let { attachments }: { attachments: ChatAttachment[] } = $props()

    // Reloj de minuto: un adjunto puede vencer con el chat abierto.
    let now = $state(Date.now())
    $effect(() => {
        const id = setInterval(() => (now = Date.now()), 60_000)
        return () => clearInterval(id)
    })
</script>

<ul class="flex max-w-[85%] flex-wrap justify-end gap-1.5" aria-label="Archivos adjuntos">
    {#each attachments as attachment (attachment.id)}
        {@const expired = isAttachmentExpired(attachment.expires_at, now)}
        {@const is_pdf = isPdfMime(attachment.mime_type)}
        <li
            class="relative overflow-hidden rounded-2xl border border-border/70 bg-card"
            title={attachment.file_name}
            style="box-shadow:0 6px 18px -14px rgba(15,23,42,0.5)"
        >
            {#if attachment.thumbnail_data_url}
                <img
                    src={attachment.thumbnail_data_url}
                    alt={attachment.file_name}
                    class="size-[92px] object-cover"
                    class:opacity-50={expired}
                />
            {:else}
                <div class="flex w-[168px] items-center gap-2 p-2" class:opacity-50={expired}>
                    <span
                        class="flex size-9 shrink-0 items-center justify-center rounded-xl {is_pdf
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-primary/10 text-primary'}"
                    >
                        {#if is_pdf}<FileText class="size-4" />{:else}<ImageIcon class="size-4" />{/if}
                    </span>
                    <span class="min-w-0 leading-tight">
                        <span class="block truncate text-[12px] font-medium">{attachment.file_name}</span>
                        <span class="block text-[10.5px] tabular-nums text-muted-foreground">
                            {is_pdf ? 'PDF' : 'Imagen'} · {formatFileSize(attachment.size_bytes)}
                        </span>
                    </span>
                </div>
            {/if}
            {#if expired}
                <span
                    class="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[9.5px] font-medium text-white"
                >
                    <Clock class="size-2.5" />Vencido
                </span>
            {/if}
        </li>
    {/each}
</ul>
