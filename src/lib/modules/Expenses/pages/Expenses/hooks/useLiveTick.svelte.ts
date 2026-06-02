import { browser } from '$app/environment'

/**
 * Marca de tiempo reactiva que avanza cada `intervalMs` ms. Sirve para forzar
 * el re-cálculo del devengo (accrual) de los gastos fijos y darles esa
 * sensación de estar corriendo en tiempo real.
 *
 * Importante (SSR): nunca leemos la hora del sistema en el servidor. En SSR
 * arranca con un epoch fijo y el intervalo solo se monta bajo `browser`. Esto
 * evita mismatches de hidratación y trabajo inútil en el server.
 *
 * Devuelve un objeto con getter `now` (Date) — consumir como `tick.now`.
 */
export function useLiveTick(intervalMs: number = 1000) {
    let now = $state<Date>(browser ? new Date() : new Date(0))

    $effect(() => {
        if (!browser) return
        // Sincroniza al montar (en SSR partió de epoch 0).
        now = new Date()
        const id = setInterval(() => {
            now = new Date()
        }, intervalMs)
        return () => clearInterval(id)
    })

    return {
        get now() {
            return now
        }
    }
}
