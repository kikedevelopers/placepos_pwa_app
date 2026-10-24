import { describe, expect, it } from 'vitest'
import { portal } from './portal'

// Nodo mínimo (entorno node, sin DOM): solo lo que usa la acción.
const fakeNode = () => {
    const node = { parent: null as unknown, remove() { this.parent = null } }
    return node
}
const fakeHost = () => {
    const children: unknown[] = []
    return {
        children,
        appendChild(n: { parent: unknown }) {
            n.parent = this
            children.push(n)
        }
    }
}

describe('portal', () => {
    it('mueve el nodo al destino y lo quita al destruirse', () => {
        const node = fakeNode()
        const host = fakeHost()
        const action = portal(node as never, host as never)
        expect(node.parent).toBe(host)
        expect(host.children).toContain(node)
        action.destroy()
        expect(node.parent).toBeNull()
    })

    it('sin document (SSR) no rompe', () => {
        const node = fakeNode()
        expect(() => portal(node as never).destroy()).not.toThrow()
    })
})
