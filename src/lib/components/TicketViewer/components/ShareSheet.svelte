<script lang="ts">
    import { FileText, Image as ImageIcon, X } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import Spinner from '$lib/components/Spinner.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import type { ShareFormat } from '../share/useShareTicket.svelte'

    interface Props {
        visible: boolean
        exporting: ShareFormat | null
        onClose: () => void
        onImage: () => void
        onPdf: () => void
    }
    let { visible, exporting, onClose, onImage, onPdf }: Props = $props()

    const busy = $derived(exporting !== null)
</script>

{#snippet option(
    icon: IconComponent,
    title: string,
    description: string,
    color: string,
    bg: string,
    loading: boolean,
    onclick: () => void
)}
    <PressableScale
        as="div"
        {onclick}
        disabled={busy}
        class="block w-full text-left"
        style={busy && !loading ? 'opacity:0.6' : ''}
    >
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <span
                class="flex h-12 w-12 items-center justify-center rounded-xl"
                style="background-color:{bg}"
            >
                {#if loading}
                    <Spinner size={22} {color} />
                {:else}
                    {@const Icon = icon}
                    <Icon size={22} {color} strokeWidth={2.2} />
                {/if}
            </span>
            <div class="flex-1">
                <p class="text-sm font-semibold text-foreground">{title}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    </PressableScale>
{/snippet}

{#if visible}
    <div class="fixed inset-0 z-[60] flex flex-col justify-end">
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0"
            style="background-color: rgba(15, 23, 42, 0.45)"
            onclick={() => !busy && onClose()}
        ></button>

        <div
            class="relative mx-auto w-full max-w-[480px] rounded-t-3xl bg-background px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] motion-safe:animate-slide-up"
        >
            <div class="mb-4 flex justify-center">
                <span class="h-1 w-10 rounded-full bg-border"></span>
            </div>

            <div class="mb-1 flex items-center justify-between">
                <h3 class="text-lg font-bold text-foreground">Compartir ticket</h3>
                <button
                    type="button"
                    aria-label="Cerrar"
                    onclick={() => !busy && onClose()}
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition-transform active:scale-[0.97]"
                >
                    <X size={16} color="hsl(215, 16%, 40%)" strokeWidth={2.2} />
                </button>
            </div>
            <p class="mb-4 text-sm text-muted-foreground">
                Elige cómo quieres compartir o guardar este ticket.
            </p>

            <div class="flex flex-col gap-3">
                {@render option(
                    ImageIcon,
                    'Compartir como imagen',
                    'Imagen PNG del recibo, lista para enviar.',
                    'hsl(217, 91%, 50%)',
                    'hsla(217, 91%, 50%, 0.12)',
                    exporting === 'image',
                    onImage
                )}
                {@render option(
                    FileText,
                    'Compartir como PDF',
                    'Documento PDF con el formato de factura.',
                    'hsl(0, 74%, 50%)',
                    'hsla(0, 84%, 55%, 0.12)',
                    exporting === 'pdf',
                    onPdf
                )}
            </div>
        </div>
    </div>
{/if}
