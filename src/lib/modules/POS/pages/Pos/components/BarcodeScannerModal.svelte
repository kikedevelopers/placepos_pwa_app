<script lang="ts">
    import { ScanLine, X, Keyboard } from '@lucide/svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'

    interface Props {
        visible: boolean
        onClose: () => void
        onScanned: (code: string) => void
    }

    let { visible, onClose, onScanned }: Props = $props()

    // Estado de permiso/cámara: 'unknown' (aún no resuelto) | 'granted' | 'denied'
    type PermState = 'unknown' | 'granted' | 'denied'
    let permission = $state<PermState>('unknown')
    let canAskAgain = $state(true)
    let scanned = $state(false)
    let manualMode = $state(false)
    let manualCode = $state('')

    let videoEl = $state<HTMLVideoElement | null>(null)

    // Recursos activos que hay que liberar al cerrar
    let stream: MediaStream | null = null
    let zxingControls: { stop: () => void } | null = null
    let detectInterval: ReturnType<typeof setInterval> | null = null
    let nativeDetector: { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } | null = null

    const BARCODE_FORMATS = [
        'qr_code',
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'code_128',
        'code_39'
    ]

    const handleScanned = (data: string) => {
        if (scanned || !data) return
        scanned = true
        onScanned(data)
        onClose()
    }

    const stopCamera = () => {
        if (detectInterval) {
            clearInterval(detectInterval)
            detectInterval = null
        }
        if (zxingControls) {
            try {
                zxingControls.stop()
            } catch {
                /* noop */
            }
            zxingControls = null
        }
        nativeDetector = null
        if (stream) {
            for (const track of stream.getTracks()) track.stop()
            stream = null
        }
        if (videoEl) videoEl.srcObject = null
    }

    // Vía rápida: BarcodeDetector nativo (Android/Chrome). Recorre los frames del <video>.
    const startNativeDetect = async () => {
        const BD = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector
        if (!BD) return false
        try {
            let supported: string[] = BARCODE_FORMATS
            if (typeof BD.getSupportedFormats === 'function') {
                const list: string[] = await BD.getSupportedFormats()
                supported = BARCODE_FORMATS.filter((f) => list.includes(f))
                if (supported.length === 0) return false
            }
            nativeDetector = new BD({ formats: supported })
            detectInterval = setInterval(async () => {
                if (scanned || !videoEl || !nativeDetector || videoEl.readyState < 2) return
                try {
                    const codes = await nativeDetector.detect(videoEl)
                    if (codes.length > 0 && codes[0].rawValue) handleScanned(codes[0].rawValue)
                } catch {
                    /* frame sin código */
                }
            }, 350)
            return true
        } catch {
            nativeDetector = null
            return false
        }
    }

    // Fallback iOS/Safari: @zxing/browser sobre el stream ya obtenido.
    const startZxing = async () => {
        try {
            const { BrowserMultiFormatReader } = await import('@zxing/browser')
            const reader = new BrowserMultiFormatReader()
            if (!videoEl || !stream) return false
            zxingControls = await reader.decodeFromStream(stream, videoEl, (result) => {
                if (result) handleScanned(result.getText())
            })
            return true
        } catch {
            zxingControls = null
            return false
        }
    }

    const startCamera = async () => {
        scanned = false
        if (!navigator.mediaDevices?.getUserMedia) {
            permission = 'denied'
            canAskAgain = false
            return
        }
        try {
            // Cámara trasera (environment) en móvil; en escritorio cae a la disponible.
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            })
            permission = 'granted'
            // Esperar a que el <video> exista en el DOM tras el cambio de estado.
            await tick()
            if (videoEl) {
                videoEl.srcObject = stream
                videoEl.setAttribute('playsinline', 'true')
                try {
                    await videoEl.play()
                } catch {
                    /* autoplay puede requerir gesto; el stream sigue visible */
                }
            }
            const native = await startNativeDetect()
            if (!native) {
                const ok = await startZxing()
                if (!ok) {
                    // Sin BarcodeDetector ni zxing operativos: ofrecer input manual.
                    manualMode = true
                }
            }
        } catch (e) {
            const err = e as DOMException
            stopCamera()
            if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
                permission = 'denied'
                // Permiso bloqueado de forma persistente; sin diálogo del sistema en web.
                canAskAgain = false
            } else {
                // NotFoundError / OverconstrainedError / etc.: sin cámara usable -> manual.
                permission = 'denied'
                canAskAgain = true
            }
        }
    }

    // tick local sin import directo para evitar SSR issues; usa microtask + rAF.
    const tick = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

    const submitManual = () => {
        const code = manualCode.trim()
        if (code) handleScanned(code)
    }

    // Arranca/limpia la cámara según `visible`.
    $effect(() => {
        if (visible) {
            scanned = false
            manualMode = false
            manualCode = ''
            permission = 'unknown'
            void startCamera()
        }
        return () => stopCamera()
    })
</script>

{#if visible}
    <div class="fixed inset-0 z-[60] flex flex-col" style="background-color: hsl(0, 0%, 0%)">
        <!-- Header -->
        <div
            class="flex flex-row items-center justify-between px-3 pb-2"
            style="padding-top: calc(env(safe-area-inset-top) + 6px)"
        >
            <button
                type="button"
                aria-label="Cerrar"
                onclick={onClose}
                class="flex h-10 w-10 items-center justify-center active:opacity-60"
            >
                <X size={24} color="hsl(0, 0%, 100%)" />
            </button>
            <span class="text-base font-bold text-white">Escanear código</span>
            <div class="w-10"></div>
        </div>

        {#if permission === 'unknown'}
            <div class="flex flex-1 items-center justify-center"></div>
        {:else if permission === 'denied' && !manualMode}
            <div class="flex flex-1 flex-col items-center justify-center px-8">
                <div
                    class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style="background-color: hsla(217, 91%, 50%, 0.18)"
                >
                    <ScanLine size={30} color="hsl(213, 94%, 68%)" strokeWidth={1.8} />
                </div>
                <p class="text-center text-base font-semibold text-white">Permiso de cámara</p>
                <p class="mb-5 mt-1.5 text-center text-sm text-white/70">
                    {canAskAgain
                        ? 'Necesitamos la cámara para escanear códigos de barras.'
                        : 'Habilita el permiso de cámara en los ajustes del navegador.'}
                </p>
                <div class="w-full max-w-xs space-y-3">
                    {#if canAskAgain}
                        <PrimaryButton label="Permitir cámara" onclick={() => void startCamera()} />
                    {/if}
                    <button
                        type="button"
                        onclick={() => {
                            manualMode = true
                        }}
                        class="flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-medium text-white/80 active:opacity-60"
                        style="background-color: hsla(0, 0%, 100%, 0.08)"
                    >
                        <Keyboard size={16} color="hsl(0, 0%, 100%)" strokeWidth={2} />
                        Ingresar código manualmente
                    </button>
                </div>
            </div>
        {:else if manualMode}
            <div class="flex flex-1 flex-col items-center justify-center px-8">
                <div
                    class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style="background-color: hsla(217, 91%, 50%, 0.18)"
                >
                    <Keyboard size={30} color="hsl(213, 94%, 68%)" strokeWidth={1.8} />
                </div>
                <p class="mb-4 text-center text-base font-semibold text-white">Ingresar código</p>
                <div class="w-full max-w-xs space-y-3">
                    <!-- svelte-ignore a11y_autofocus -->
                    <input
                        type="text"
                        inputmode="text"
                        autocomplete="off"
                        autofocus
                        bind:value={manualCode}
                        onkeydown={(e) => {
                            if (e.key === 'Enter') submitManual()
                        }}
                        placeholder="Código de barras"
                        class="w-full rounded-[14px] px-4 py-3 text-center text-base text-white placeholder:text-white/40 focus:outline-none"
                        style="background-color: hsla(0, 0%, 100%, 0.1)"
                    />
                    <PrimaryButton label="Buscar producto" onclick={submitManual} />
                </div>
            </div>
        {:else}
            <!-- Vista de cámara -->
            <div class="relative flex-1">
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                    bind:this={videoEl}
                    autoplay
                    muted
                    playsinline
                    class="h-full w-full object-cover"
                ></video>
                <div
                    class="absolute left-0 right-0 flex items-center justify-center"
                    style="bottom: calc(env(safe-area-inset-bottom) + 32px)"
                >
                    <div
                        class="rounded-full px-4 py-2"
                        style="background-color: hsla(0, 0%, 0%, 0.55)"
                    >
                        <span class="text-sm text-white">Apunta al código de barras</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}
