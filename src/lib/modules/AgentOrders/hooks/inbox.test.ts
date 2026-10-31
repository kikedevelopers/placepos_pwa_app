import { describe, expect, it, vi } from 'vitest'
import type { AgentOrdersList } from '$lib/api/requests/agentOrders/types'

vi.mock('$lib/api/requests/agentOrders', () => ({}))
vi.mock('$lib/hooks/useDebouncedValue.svelte', () => ({}))

const { nextPageOf } = await import('./useAgentOrdersInbox.svelte')

const page = (n: number, items: number, total: number): AgentOrdersList =>
    ({
        items: Array.from({ length: items }, (_, i) => ({ id: n * 100 + i })),
        total_count: total,
        page: n,
        limit: 25,
        summary: {} as AgentOrdersList['summary']
    }) as AgentOrdersList

describe('nextPageOf', () => {
    it('quedan pedidos: la siguiente página', () => {
        expect(nextPageOf([page(1, 25, 60)])).toBe(2)
        expect(nextPageOf([page(1, 25, 60), page(2, 25, 60)])).toBe(3)
    })

    it('ya están todos: no hay más', () => {
        expect(nextPageOf([page(1, 25, 60), page(2, 25, 60), page(3, 10, 60)])).toBeUndefined()
        expect(nextPageOf([page(1, 3, 3)])).toBeUndefined()
    })

    it('página vacía o sin páginas: no hay más (evita pedir sin fin)', () => {
        expect(nextPageOf([page(1, 0, 10)])).toBeUndefined()
        expect(nextPageOf([])).toBeUndefined()
    })
})
