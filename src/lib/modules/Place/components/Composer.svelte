<script lang="ts">
    import { onDestroy } from 'svelte'
    import { toast } from 'svelte-sonner'
    import { ArrowUp, Camera, FolderOpen, Paperclip, Square } from '@lucide/svelte'
    import { uploadAiAttachment } from '$lib/api/requests/ai'
    import {
        FILE_PICKER_ACCEPT,
        MAX_ATTACHMENTS_PER_MESSAGE,
        pickPastedFiles,
        type ChatAttachment
    } from '$lib/modules/Place/lib/attachments'
    import { createThumbnail, decodeImage, resizeImage } from '$lib/modules/Place/lib/image-canvas'
    import { prepareImage } from '$lib/modules/Place/lib/prepare-image'
    import { AttachmentDraft, canSubmitMessage } from '$lib/modules/Place/store/attachment-draft.svelte'
    import AttachmentChip from './AttachmentChip.svelte'

    interface Props {
        assistantName: string
        isStreaming: boolean
        disabled?: boolean
        /** Placeholder cuando está deshabilitado (p. ej. sin consultas del día). */
        disabledPlaceholder?: string
        /** Línea informativa del pie (p. ej. "Te quedan 3 consultas hoy"). */
        hint?: string | null
        seed?: { value: string; token: number } | null
        onsend: (text: string, attachments: ChatAttachment[]) => void
        onstop: () => void
    }
    let {
        assistantName,
        isStreaming,
        disabled = false,
        disabledPlaceholder,
        hint = null,
        seed = null,
        onsend,
        onstop
    }: Props = $props()

    let draft = $state('')
    let textarea: HTMLTextAreaElement | null = $state(null)
    let camera_input: HTMLInputElement | null = $state(null)
    let file_input: HTMLInputElement | null = $state(null)
    let menu_open = $state(false)
    const MAX_H = 140

    // Fotos/PDF: se suben apenas se eligen; al enviar solo viajan los ids.
    const attachments = new AttachmentDraft({
        upload: uploadAiAttachment,
        prepareImage: (file) =>
            prepareImage(file, { decode: decodeImage, resize: resizeImage, thumbnail: createThumbnail }),
        notify: (message) => toast.error(message)
    })
    onDestroy(() => attachments.clear())

    const ready_attachments = $derived(attachments.ready)
    const is_full = $derived(attachments.items.length >= MAX_ATTACHMENTS_PER_MESSAGE)
    const can_attach = $derived(!disabled && !is_full)

    const canSend = $derived(
        canSubmitMessage({
            text: draft,
            ready_count: ready_attachments.length,
            is_busy: attachments.is_busy,
            has_errors: attachments.has_errors,
            is_streaming: isStreaming,
            disabled
        })
    )

    const placeholder = $derived(
        disabled
            ? (disabledPlaceholder ?? `${assistantName} no está disponible`)
            : attachments.items.length > 0
              ? 'Agrega un mensaje (opcional)…'
              : `Pregúntale a ${assistantName}…`
    )

    function autogrow() {
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_H)}px`
    }

    $effect(() => {
        void draft
        autogrow()
    })

    // Sin créditos se cierra el menú de adjuntar.
    $effect(() => {
        if (disabled) menu_open = false
    })

    // Sugerencia elegida en la bienvenida: entra al input y toma el foco.
    let lastSeed = 0
    $effect(() => {
        if (seed && seed.token !== lastSeed) {
            lastSeed = seed.token
            draft = seed.value
            textarea?.focus()
        }
    })

    function submit() {
        if (!canSend) return
        onsend(draft.trim(), ready_attachments)
        draft = ''
        attachments.clear()
    }

    function onkeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    function addFiles(list: FileList | null | undefined) {
        const files = Array.from(list ?? [])
        if (files.length === 0 || disabled) return
        void attachments.add(files)
    }

    function onpicked(e: Event) {
        const input = e.currentTarget as HTMLInputElement
        addFiles(input.files)
        // Permite volver a elegir el mismo archivo.
        input.value = ''
    }

    function openPicker(input: HTMLInputElement | null) {
        menu_open = false
        input?.click()
    }

    // Pegar una captura (escritorio): solo imágenes; el texto pega normal.
    function onpaste(e: ClipboardEvent) {
        const images = pickPastedFiles(Array.from(e.clipboardData?.files ?? []))
        if (images.length === 0) return
        e.preventDefault()
        if (disabled) return
        void attachments.add(images)
    }
</script>

<div
    class="relative z-10 shrink-0 px-3 pt-2"
    style="padding-bottom:calc(env(safe-area-inset-bottom) + 0.6rem)"
>
    {#if menu_open}
        <!-- Toque fuera del menú: lo cierra. -->
        <button
            type="button"
            aria-label="Cerrar menú de adjuntar"
            class="fixed inset-0 z-10 cursor-default"
            onclick={() => (menu_open = false)}
        ></button>
        <div
            role="menu"
            class="absolute bottom-full left-3 z-20 mb-1 w-56 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-1 backdrop-blur-xl origin-bottom-left motion-safe:animate-scale-in"
            style="box-shadow:0 18px 40px -18px rgba(15,23,42,0.55)"
        >
            <button
                type="button"
                role="menuitem"
                onclick={() => openPicker(camera_input)}
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] active:bg-muted"
            >
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Camera class="size-4" />
                </span>
                <span class="leading-tight">
                    <span class="block font-medium">Tomar foto</span>
                    <span class="block text-[11px] text-muted-foreground">De una factura o documento</span>
                </span>
            </button>
            <button
                type="button"
                role="menuitem"
                onclick={() => openPicker(file_input)}
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] active:bg-muted"
            >
                <span class="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                    <FolderOpen class="size-4" />
                </span>
                <span class="leading-tight">
                    <span class="block font-medium">Elegir archivo</span>
                    <span class="block text-[11px] text-muted-foreground">Foto o PDF · máx. 15 MB</span>
                </span>
            </button>
        </div>
    {/if}

    <input
        bind:this={camera_input}
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        onchange={onpicked}
    />
    <input
        bind:this={file_input}
        type="file"
        accept={FILE_PICKER_ACCEPT}
        multiple
        class="hidden"
        onchange={onpicked}
    />

    <div
        class="flex flex-col rounded-[22px] border border-border/70 bg-card/85 backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-primary/45"
        style="box-shadow:0 10px 30px -16px rgba(15,23,42,0.4)"
    >
        {#if attachments.items.length > 0}
            <div class="flex gap-1.5 overflow-x-auto px-2 pt-2 [scrollbar-width:none]">
                {#each attachments.items as item (item.local_id)}
                    <AttachmentChip
                        {item}
                        can_retry={attachments.canRetry(item.local_id)}
                        onretry={() => void attachments.retry(item.local_id)}
                        onremove={() => attachments.remove(item.local_id)}
                    />
                {/each}
            </div>
        {/if}

        <div class="flex items-end gap-1.5 py-1.5 pl-1.5 pr-1.5">
            <button
                type="button"
                onclick={() => (menu_open = !menu_open)}
                disabled={!can_attach}
                aria-label="Adjuntar foto o PDF"
                aria-haspopup="menu"
                aria-expanded={menu_open}
                title={is_full ? `Máximo ${MAX_ATTACHMENTS_PER_MESSAGE} archivos por mensaje` : 'Adjuntar foto o PDF'}
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[transform,background-color] active:scale-95 disabled:opacity-40 {menu_open
                    ? 'bg-primary/10 text-primary'
                    : ''}"
            >
                <Paperclip size={18} />
            </button>

            <textarea
                bind:this={textarea}
                bind:value={draft}
                {onkeydown}
                {onpaste}
                rows="1"
                {disabled}
                {placeholder}
                class="max-h-[140px] flex-1 resize-none bg-transparent py-2 text-[14px] leading-[1.5] text-foreground outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
            ></textarea>

            {#if isStreaming}
                <button
                    type="button"
                    onclick={onstop}
                    aria-label="Detener"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background active:scale-95"
                >
                    <Square size={13} fill="currentColor" />
                </button>
            {:else}
                <button
                    type="button"
                    onclick={submit}
                    disabled={!canSend}
                    aria-label="Enviar"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-[opacity,transform] active:scale-95 disabled:bg-muted disabled:text-muted-foreground/50"
                    style={canSend
                        ? 'background-image:linear-gradient(135deg,#1e7df0,#4f46e5);box-shadow:0 4px 12px -4px rgba(30,125,240,0.8)'
                        : ''}
                >
                    <ArrowUp size={18} />
                </button>
            {/if}
        </div>
    </div>
    <p class="mt-1 px-1 text-center text-[10.5px] text-muted-foreground/60">
        {#if attachments.is_busy}
            Subiendo archivos… ·
        {:else if attachments.has_errors}
            Reintenta o quita el archivo con error para enviar ·
        {:else if hint}
            {hint} ·
        {/if}
        La IA puede equivocarse. Verifica los datos importantes.
    </p>
</div>
