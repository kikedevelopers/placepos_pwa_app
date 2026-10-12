/**
 * Decisión pura del guard de la ruta del chat (sin imports: testeable sin tocar
 * `$env` ni la capa de red). Se expulsa SOLO cuando el estado ya cargó y el
 * servidor reporta enabled:false (Place apagado para la cuenta). Mientras carga
 * no se decide nada; sin un enabled:false explícito no se expulsa.
 */
export const shouldBlockPlaceRoute = (p: {
    isLoading: boolean
    enabled: boolean | undefined
}): boolean => !p.isLoading && p.enabled === false
