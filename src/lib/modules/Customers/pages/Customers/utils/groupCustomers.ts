/**
 * Agrupación alfabética estilo Contactos de iOS: orden por nombre en español
 * (ignora mayúsculas y tildes) y una sección por letra inicial; lo que no
 * empieza por letra va a "#" al final.
 */
export interface LetterGroup<T> {
    letter: string
    items: T[]
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

/** Letra índice de un nombre: "Ángela" → "A", "ñandú" → "Ñ", "3M" → "#". */
export function indexLetter(name: string): string {
    const first = name.trim().charAt(0)
    if (!first) return '#'
    const upper = first.toLocaleUpperCase('es')
    if (upper === 'Ñ') return 'Ñ'
    const plain = upper.normalize('NFD').replace(/[̀-ͯ]/g, '')
    return /^[A-Z]$/.test(plain) ? plain : '#'
}

export function groupByInitial<T>(items: readonly T[], getName: (item: T) => string): LetterGroup<T>[] {
    const sorted = [...items].sort((a, b) => collator.compare(getName(a).trim(), getName(b).trim()))
    const groups: LetterGroup<T>[] = []
    let current: LetterGroup<T> | null = null
    const tail: T[] = []
    for (const item of sorted) {
        const letter = indexLetter(getName(item))
        if (letter === '#') {
            tail.push(item)
            continue
        }
        if (!current || current.letter !== letter) {
            current = { letter, items: [] }
            groups.push(current)
        }
        current.items.push(item)
    }
    if (tail.length > 0) groups.push({ letter: '#', items: tail })
    return groups
}
