import type { CompanyProfile } from '$lib/api/requests/authentication/types'
import type { PurchaseDetail } from '$lib/api/requests/purchases'
import { formatCurrency, formatNumber } from '$lib/utils/numbers'

/**
 * HTML para el PDF del comprobante de compra (formato carta, Helvetica),
 * replicando el diseño del recibo de venta pero con los datos del proveedor y
 * el desglose de la compra. En la web el PDF se obtiene imprimiendo este HTML.
 */

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

const formatPdfDate = (iso: string): string =>
    new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(iso))

export const buildPurchasePdfHtml = (
    purchase: PurchaseDetail,
    company: CompanyProfile | null
): string => {
    const companyName = escapeHtml(company?.name || 'Sin nombre de empresa')

    const companyDetails = [
        company?.document_number ? `NIT: ${escapeHtml(company.document_number)}` : '',
        company?.address ? escapeHtml(company.address) : '',
        company?.phone_number ? `Tel: ${escapeHtml(company.phone_number)}` : '',
        company?.email ? escapeHtml(company.email) : ''
    ]
        .filter(Boolean)
        .map((line) => `<div class="company-detail">${line}</div>`)
        .join('')

    const rows = purchase.lines
        .map(
            (line) => `
        <tr class="row">
          <td class="cell col-product">${escapeHtml(line.name)}</td>
          <td class="cell col-qty">${formatNumber(line.packaging_qty, 2)}</td>
          <td class="cell col-price">${formatCurrency(line.packaging_price)}</td>
          <td class="cell-bold col-total">${formatCurrency(line.total)}</td>
        </tr>`
        )
        .join('')

    const registeredRow = purchase.created_by
        ? `<div class="info-text"><span class="info-bold">Registrado por: </span>${escapeHtml(purchase.created_by)}</div>`
        : ''

    const notesBlock = purchase.notes
        ? `<div class="notes"><div class="info-label">Observaciones</div><div class="info-text">${escapeHtml(purchase.notes)}</div></div>`
        : ''

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 9pt;
    color: #333333;
    background: #ffffff;
    padding: 50px 60px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #333333;
  }
  .company { flex: 1; padding-right: 20px; }
  .company-name { font-size: 16pt; font-weight: bold; color: #000000; margin-bottom: 6px; }
  .company-detail { font-size: 8pt; color: #555555; margin-top: 1px; }
  .invoice { text-align: right; }
  .invoice-label {
    font-size: 9pt; font-weight: bold; color: #000000;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;
  }
  .invoice-number { font-size: 14pt; font-weight: bold; color: #000000; }
  .invoice-date { font-size: 8pt; color: #555555; margin-top: 3px; }

  .info { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; }
  .info-box { flex: 1; padding: 8px; }
  .info-label {
    font-size: 7pt; font-weight: bold; color: #000000;
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #dddddd;
  }
  .info-text { font-size: 9pt; color: #333333; margin-top: 1px; }
  .info-bold { font-weight: bold; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  .table-header th {
    font-weight: bold; font-size: 8pt; color: #000000; text-transform: uppercase;
    border-bottom: 1px solid #333333; padding: 6px 4px;
  }
  .cell, .cell-bold { font-size: 8pt; color: #333333; padding: 6px 4px; border-bottom: 0.5px solid #cccccc; }
  .cell-bold { font-weight: bold; }
  .col-product { width: 45%; text-align: left; padding-right: 8px; }
  .col-qty { width: 10%; text-align: right; }
  .col-price { width: 20%; text-align: right; }
  .col-total { width: 25%; text-align: right; }

  .totals { display: flex; justify-content: flex-end; margin-top: 8px; margin-bottom: 20px; }
  .totals-box { width: 45%; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .total-row.grand { border-top: 0.5px solid #333333; margin-top: 3px; padding-top: 6px; }
  .total-label { font-size: 9pt; color: #333333; }
  .total-label.bold { font-weight: bold; color: #000000; }
  .total-value { font-size: 9pt; color: #333333; }
  .total-value.bold { font-size: 11pt; font-weight: bold; color: #000000; }

  .notes { margin-bottom: 20px; }

  .footer { margin-top: 40px; padding-top: 10px; border-top: 0.5px solid #cccccc; }
  .footer-bold { font-size: 7pt; font-weight: bold; color: #333333; }
</style>
</head>
<body>
  <div class="header">
    <div class="company">
      <div class="company-name">${companyName}</div>
      ${companyDetails}
    </div>
    <div class="invoice">
      <div class="invoice-label">Comprobante de compra</div>
      <div class="invoice-number">${escapeHtml(purchase.purchase_number)}</div>
      <div class="invoice-date">${formatPdfDate(purchase.created_at)}</div>
    </div>
  </div>

  <div class="info">
    <div class="info-box">
      <div class="info-label">Proveedor</div>
      <div class="info-text info-bold">${escapeHtml(purchase.supplier_name)}</div>
      ${registeredRow}
    </div>
    <div class="info-box">
      <div class="info-label">Información del Documento</div>
      <div class="info-text"><span class="info-bold">Fecha: </span>${formatPdfDate(purchase.created_at)}</div>
      ${purchase.invoice_number ? `<div class="info-text"><span class="info-bold">Factura: </span>${escapeHtml(purchase.invoice_number)}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr class="table-header">
        <th class="col-product">Producto</th>
        <th class="col-qty">Cant.</th>
        <th class="col-price">Precio</th>
        <th class="col-total">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatCurrency(purchase.subtotal)}</span>
      </div>
      <div class="total-row">
        <span class="total-label">IVA</span>
        <span class="total-value">${formatCurrency(purchase.iva_total)}</span>
      </div>
      <div class="total-row grand">
        <span class="total-label bold">TOTAL</span>
        <span class="total-value bold">${formatCurrency(purchase.total)}</span>
      </div>
    </div>
  </div>

  ${notesBlock}

  <div class="footer">
    <div class="footer-bold">*** Documento no válido como factura ***</div>
  </div>
</body>
</html>`
}
