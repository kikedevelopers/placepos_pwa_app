/**
 * Cálculos de crédito compartidos entre el Dashboard, Finanzas y Cajeros.
 *
 * Contexto (base DEVENGADO): una venta a CRÉDITO cuenta como venta del día por
 * su valor íntegro y se discrimina con su propia ganancia/margen. El margen del
 * crédito se deriva de esos dos valores devengados que manda el backend.
 *
 * Cálculo plano (number), fiel a placepos (renderer usa aritmética plana sobre
 * valores ya redondeados por el backend; el redondeo financiero canónico vive
 * en el backend con Big.js).
 */

/**
 * Margen del crédito en porcentaje = ganancia / total × 100.
 *
 * Defensivo: si `total` es 0, negativo o no finito (o `profit` no es finito)
 * devuelve 0 — nunca `NaN`/`Infinity`, para no romper el `.toFixed()` de la UI.
 */
export function creditMarginPct(total: number, profit: number): number {
    if (
        typeof total !== 'number' ||
        typeof profit !== 'number' ||
        !Number.isFinite(total) ||
        !Number.isFinite(profit) ||
        total <= 0
    ) {
        return 0
    }
    return (profit / total) * 100
}
