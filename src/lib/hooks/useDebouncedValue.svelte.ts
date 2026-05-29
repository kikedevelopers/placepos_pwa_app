/**
 * Versión runes de `useDebouncedValue` de pos_app. Recibe un getter del valor
 * fuente y expone `.value` con el valor retrasado. Debe llamarse durante la
 * inicialización de un componente (usa `$effect`).
 */
export function useDebouncedValue<T>(get: () => T, delay = 400) {
    let debounced = $state(get())

    $effect(() => {
        const value = get()
        const timer = setTimeout(() => {
            debounced = value
        }, delay)
        return () => clearTimeout(timer)
    })

    return {
        get value() {
            return debounced
        }
    }
}
