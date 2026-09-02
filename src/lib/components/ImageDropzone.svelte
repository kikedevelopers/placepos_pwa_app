<script lang="ts">
    import { ImagePlus, Loader2, Trash2, UploadCloud } from '@lucide/svelte'
    import {
        buildImageHint,
        DEFAULT_IMAGE_SETTINGS,
        IMAGE_ACCEPT_ATTRIBUTE,
        validateProductImageFile,
        type ProductImageSettings
    } from '$lib/utils/productImage'

    /**
     * Cuadro para cargar UNA imagen: se puede arrastrar el archivo encima
     * (navegador de escritorio) o tocar para abrir el selector — la
     * interacción principal en un dispositivo táctil.
     *
     * La validación ocurre aquí mismo (tipo y peso) para que el usuario vea el
     * problema antes de que el archivo salga por la red. El servidor vuelve a
     * validar —leyendo los bytes reales— porque este lado no es de fiar.
     */
    interface Props {
        /** Imagen ya guardada (URL firmada). `null`/`undefined` = el item no tiene. */
        currentUrl?: string | null
        /** Archivo elegido y aún sin subir. Se previsualiza desde el disco. */
        pendingFile?: File | null
        /** Se dispara al elegir un archivo válido. */
        onSelect: (file: File) => void
        /** Se dispara al quitar (descarta el pendiente o borra la ya guardada). */
        onRemove: () => void
        /**
         * El item TIENE imagen guardada aunque no se pueda mostrar (firma caída).
         * Sin esto, una imagen cuya URL falla parecería inexistente y quedaría
         * imposible de borrar.
         */
        hasStoredImage?: boolean
        /** Límites del servidor. Se usan para validar y para el texto de ayuda. */
        settings?: ProductImageSettings
        /** Bloquea la interacción mientras se guarda. */
        disabled?: boolean
        /** Muestra el spinner sobre la miniatura durante la subida. */
        isUploading?: boolean
    }
    let {
        currentUrl = null,
        pendingFile = null,
        onSelect,
        onRemove,
        hasStoredImage = false,
        settings = DEFAULT_IMAGE_SETTINGS,
        disabled = false,
        isUploading = false
    }: Props = $props()

    const inputId = $props.id()
    let inputEl = $state<HTMLInputElement>()
    let isDragging = $state(false)
    let error = $state<string | null>(null)
    let pendingPreview = $state<string | null>(null)

    // Previsualización del archivo local. El object URL se revoca al cambiar:
    // sin eso, cada foto elegida queda retenida en memoria.
    $effect(() => {
        const file = pendingFile
        if (!file) {
            pendingPreview = null
            return
        }
        const url = URL.createObjectURL(file)
        pendingPreview = url
        return () => URL.revokeObjectURL(url)
    })

    const preview = $derived(pendingPreview ?? currentUrl ?? null)
    // Hay algo que quitar aunque no haya nada que mostrar (firma caída).
    const canRemove = $derived(Boolean(preview) || hasStoredImage)

    const handleFile = (file: File | undefined) => {
        if (!file) return
        const validation = validateProductImageFile(file, settings)
        if (validation) {
            error = validation.message
            return
        }
        error = null
        onSelect(file)
    }

    const openPicker = () => {
        if (disabled) return
        inputEl?.click()
    }

    const handleDrop = (event: DragEvent) => {
        event.preventDefault()
        isDragging = false
        if (disabled) return
        handleFile(event.dataTransfer?.files?.[0])
    }

    // Sin este preventDefault el navegador abre la imagen en vez de soltarla.
    const handleDragOver = (event: DragEvent) => {
        event.preventDefault()
        if (!disabled) isDragging = true
    }

    const handleRemove = (event: MouseEvent) => {
        // Sin esto el clic burbujea al contenedor y reabre el selector.
        event.stopPropagation()
        error = null
        // Permite volver a elegir EL MISMO archivo: sin limpiar el value, el
        // input no dispara `change` con la misma ruta.
        if (inputEl) inputEl.value = ''
        onRemove()
    }

    const handleKeydown = (event: KeyboardEvent) => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openPicker()
        }
    }
</script>

<div>
    <label for={inputId} class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
        >Imagen</label
    >
    <div
        role="button"
        tabindex={disabled ? -1 : 0}
        aria-label={canRemove ? 'Cambiar imagen' : 'Cargar imagen'}
        onclick={openPicker}
        onkeydown={handleKeydown}
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={() => (isDragging = false)}
        class="relative flex items-center gap-3 rounded-[14px] px-3.5 py-3 outline-none transition-colors {disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer'}"
        style="border:1.5px dashed {isDragging
            ? 'hsl(217, 91%, 50%)'
            : error
              ? 'hsl(0, 84%, 55%)'
              : 'hsla(214, 32%, 89%, 0.9)'};background-color:{isDragging
            ? 'hsla(217, 91%, 50%, 0.06)'
            : 'hsla(0, 0%, 100%, 0.7)'}"
    >
        <div
            class="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary"
        >
            {#if preview}
                <img src={preview} alt="Imagen del producto" class="h-full w-full object-cover" />
            {:else}
                <ImagePlus size={22} color="hsl(215, 16%, 55%)" strokeWidth={1.8} />
            {/if}
            {#if isUploading}
                <div class="absolute inset-0 flex items-center justify-center bg-card/70">
                    <Loader2 size={18} color="hsl(217, 91%, 50%)" class="animate-spin" />
                </div>
            {/if}
        </div>

        <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5 text-sm font-semibold leading-tight text-foreground">
                <UploadCloud size={14} color="hsl(215, 16%, 55%)" />
                {canRemove ? 'Cambiar imagen' : 'Arrastra una imagen o toca aquí'}
            </p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                {buildImageHint(settings)}
            </p>
        </div>

        {#if canRemove && !disabled}
            <button
                type="button"
                onclick={handleRemove}
                aria-label="Quitar imagen"
                class="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors active:bg-destructive/10 active:text-destructive"
            >
                <Trash2 size={16} />
            </button>
        {/if}

        <input
            id={inputId}
            bind:this={inputEl}
            type="file"
            accept={IMAGE_ACCEPT_ATTRIBUTE}
            class="hidden"
            onchange={(e) => {
                handleFile(e.currentTarget.files?.[0])
                // Permite reelegir el mismo archivo tras quitarlo.
                e.currentTarget.value = ''
            }}
        />
    </div>
    {#if error}
        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{error}</p>
    {/if}
</div>
