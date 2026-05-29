import { toBlob } from 'html-to-image'
import type { CompanyProfile } from '$lib/api/requests/authentication/types'
import type { SaleDetail } from '$lib/api/requests/sales'
import { buildTicketPdfHtml } from './ticketPdfHtml'

export type ShareFormat = 'image' | 'pdf'

const fileName = (sale: SaleDetail, ext: string): string => {
    const n = sale.ticketType === 'SALE' && sale.saleNumber ? sale.saleNumber : sale.ticketNumber
    return `ticket-${n}.${ext}`.replace(/\s+/g, '-')
}

const shareOrDownload = async (blob: Blob, name: string, type: string) => {
    const file = new File([blob], name, { type })
    // Web Share API con archivos (móvil/PWA). Fallback: descarga directa.
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: 'Compartir ticket' })
            return
        } catch {
            // El usuario canceló el share nativo: no forzamos descarga.
            return
        }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
}

/**
 * Exporta el ticket como imagen (captura del recibo con html-to-image, igual que
 * la captura de placepos) o como PDF (mismo HTML del diseño placepos, vía la
 * impresión del navegador → "Guardar como PDF"). Usa la Web Share API cuando
 * está disponible (PWA en móvil), si no descarga el archivo.
 */
export function useShareTicket() {
    let exporting = $state<ShareFormat | null>(null)

    const shareAsImage = async (node: HTMLElement | null | undefined, sale: SaleDetail) => {
        if (exporting || !node) return
        exporting = 'image'
        try {
            const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
            if (blob) await shareOrDownload(blob, fileName(sale, 'png'), 'image/png')
        } catch {
            // silencioso: el usuario puede reintentar
        } finally {
            exporting = null
        }
    }

    const shareAsPdf = async (sale: SaleDetail, company: CompanyProfile | null) => {
        if (exporting) return
        exporting = 'pdf'
        try {
            const html = buildTicketPdfHtml(sale, company)
            const win = window.open('', '_blank', 'width=820,height=1000')
            if (win) {
                win.document.open()
                win.document.write(html)
                win.document.close()
                win.focus()
                // Espera al render antes de abrir el diálogo de impresión/guardar PDF.
                setTimeout(() => win.print(), 350)
            }
        } finally {
            exporting = null
        }
    }

    return {
        get exporting() {
            return exporting
        },
        shareAsImage,
        shareAsPdf
    }
}
