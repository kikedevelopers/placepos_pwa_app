import { toBlob } from 'html-to-image'
import type { CompanyProfile } from '$lib/api/requests/authentication/types'
import type { PurchaseDetail } from '$lib/api/requests/purchases'
import { buildPurchasePdfHtml } from './purchasePdfHtml'

export type ShareFormat = 'image' | 'pdf'

const fileName = (purchase: PurchaseDetail, ext: string): string =>
    `compra-${purchase.purchase_number}.${ext}`.replace(/\s+/g, '-')

const shareOrDownload = async (blob: Blob, name: string, type: string) => {
    const file = new File([blob], name, { type })
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: 'Compartir compra' })
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
 * Exporta el comprobante de compra como imagen (captura del recibo con
 * html-to-image) o como PDF (mismo HTML del diseño, vía impresión del
 * navegador). Usa la Web Share API cuando está disponible.
 */
export function usePurchaseShare() {
    let exporting = $state<ShareFormat | null>(null)

    const shareAsImage = async (
        node: HTMLElement | null | undefined,
        purchase: PurchaseDetail
    ) => {
        if (exporting || !node) return
        exporting = 'image'
        try {
            const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
            if (blob) await shareOrDownload(blob, fileName(purchase, 'png'), 'image/png')
        } catch {
            // silencioso: el usuario puede reintentar
        } finally {
            exporting = null
        }
    }

    const shareAsPdf = async (purchase: PurchaseDetail, company: CompanyProfile | null) => {
        if (exporting) return
        exporting = 'pdf'
        try {
            const html = buildPurchasePdfHtml(purchase, company)
            const win = window.open('', '_blank', 'width=820,height=1000')
            if (win) {
                win.document.open()
                win.document.write(html)
                win.document.close()
                win.focus()
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
