// Lógica pura del header de la app (testeada en appHeader.test.ts).

const ROLE_LABELS: Record<string, string> = {
    superadmin: 'Administrador',
    owner: 'Propietario',
    manager: 'Gerente',
    employee: 'Empleado'
}

/** Rótulo del rol; uno desconocido se muestra como "Usuario". */
export const roleLabel = (type: string): string => ROLE_LABELS[type] ?? 'Usuario'

/** Saludo según la hora local: mañana < 12, tarde < 19, noche. */
export const greetingFor = (hour: number): string => {
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
}

/** Iniciales de las dos primeras palabras ("Enrique Pacheco" → "EP"). */
export const initialsOf = (name: string): string => {
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('')
    return initials || 'U'
}
