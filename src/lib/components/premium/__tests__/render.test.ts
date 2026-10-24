import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import { Inbox } from '@lucide/svelte'
import Money from '../Money.svelte'
import Segmented from '../Segmented.svelte'
import TabRail from '../TabRail.svelte'
import Metrics from '../Metrics.svelte'
import Row from '../Row.svelte'
import Hero from '../Hero.svelte'
import Pill from '../Pill.svelte'
import EmptyState from '../EmptyState.svelte'
import ToolbarChip from '../ToolbarChip.svelte'
import SkeletonList from '../SkeletonList.svelte'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body

describe('Money', () => {
    it('símbolo y decimales atenuados, entero protagonista', () => {
        const body = html(Money, { value: 4033846.08 })
        expect(body).toContain('4.033.846')
        expect(body).toContain(',08')
        expect(body).toContain('opacity-55')
        expect(body).toContain('tabular-nums')
    })

    it('negativos con signo tipográfico; positivos con + solo si se pide', () => {
        expect(html(Money, { value: -1500 })).toContain('−')
        expect(html(Money, { value: 1500 })).not.toContain('+')
        expect(html(Money, { value: 1500, signed: true })).toContain('+')
        expect(html(Money, { value: 0, signed: true })).not.toContain('+')
    })
})

describe('Segmented', () => {
    const options = [
        { value: 'a', label: 'Uno' },
        { value: 'b', label: 'Dos' },
        { value: 'c', label: 'Tres' }
    ]

    it('es un radiogroup accesible con la opción elegida marcada', () => {
        const body = html(Segmented, { options, value: 'b', onChange: () => {}, ariaLabel: 'Prueba' })
        expect(body).toContain('role="radiogroup"')
        expect(body).toContain('aria-label="Prueba"')
        expect(body.match(/aria-checked="true"/g)).toHaveLength(1)
        expect(body).toMatch(/aria-checked="true"[^>]*>\s*Dos/)
    })

    it('el indicador se desplaza al segmento elegido (transform, no left)', () => {
        const body = html(Segmented, { options, value: 'c', onChange: () => {}, ariaLabel: 'x' })
        expect(body).toContain('translateX(200%)')
        expect(body).toContain('repeat(3, minmax(0, 1fr))')
    })

    it('un valor desconocido no rompe: indicador en el primero', () => {
        expect(html(Segmented, { options, value: 'zz', onChange: () => {}, ariaLabel: 'x' })).toContain('translateX(0%)')
    })
})

describe('TabRail', () => {
    it('marca la pestaña activa como tab seleccionada', () => {
        const body = html(TabRail, {
            tabs: [
                { id: 'sales', label: 'Ventas' },
                { id: 'credits', label: 'Cartera' }
            ],
            value: 'credits',
            onChange: () => {},
            ariaLabel: 'Informes'
        })
        expect(body).toContain('role="tablist"')
        expect(body).toMatch(/aria-selected="true"[^>]*>\s*Cartera/)
        expect(body.match(/aria-selected="true"/g)).toHaveLength(1)
    })
})

describe('Metrics', () => {
    const items = [
        { label: 'A', amount: 100 },
        { label: 'B', text: '7', tone: 'warning' as const },
        { label: 'C', amount: -5, tone: 'negative' as const },
        { label: 'D', text: '0' }
    ]

    it('2 columnas: líneas solo ENTRE celdas', () => {
        const body = html(Metrics, { items, ariaLabel: 'm' })
        expect(body).toContain('grid-cols-2')
        // Celdas 2 y 4 llevan línea izquierda; 3 y 4 línea superior.
        expect(body.match(/\bborder-l\b/g)).toHaveLength(2)
        expect(body.match(/\bborder-t\b/g)).toHaveLength(2)
    })

    it('3 columnas: la primera fila no lleva línea superior', () => {
        const body = html(Metrics, { items: items.slice(0, 3), ariaLabel: 'm', columns: 3 })
        expect(body).toContain('grid-cols-3')
        expect(body).not.toMatch(/\bborder-t\b/)
        expect(body.match(/\bborder-l\b/g)).toHaveLength(2)
    })

    it('aplica el tono y, cargando, muestra esqueletos en vez de cifras', () => {
        expect(html(Metrics, { items, ariaLabel: 'm' })).toContain('text-warning')
        const loading = html(Metrics, { items, ariaLabel: 'm', loading: true })
        expect(loading).toContain('skeleton')
        expect(loading).not.toContain('text-warning')
    })
})

describe('Row', () => {
    it('sin onclick es un div sin chevron', () => {
        const body = html(Row, { label: 'Venta en efectivo', valueText: '$ 5.500' })
        expect(body.replace(/<!--.*?-->/g, '').trim().startsWith('<div')).toBe(true)
        expect(body).not.toContain('<button')
        expect(body).toContain('$ 5.500')
        expect(body).not.toContain('lucide-chevron-right')
    })

    it('con onclick es un botón con chevron', () => {
        const body = html(Row, { label: 'Abrir', onclick: () => {} })
        expect(body).toContain('<button')
        expect(body).toContain('lucide-chevron-right')
    })

    it('sub-fila con sangría y total con énfasis', () => {
        expect(html(Row, { label: 'Sub', valueText: '1', level: 1 })).toContain('pl-8')
        expect(html(Row, { label: 'Total', valueText: '1', emphasis: 'total' })).toContain('text-[15.5px] font-semibold')
    })

    it('detalle bajo la etiqueta y tono del valor', () => {
        const body = html(Row, { label: 'L', detail: 'Gan. $ 10', valueText: '$ 1', valueTone: 'negative' })
        expect(body).toContain('Gan. $ 10')
        expect(body).toContain('text-destructive')
    })
})

describe('Hero', () => {
    it('variación positiva verde con flecha arriba', () => {
        const body = html(Hero, { label: 'Ingresos', amount: 1000, deltaPct: 12.4 })
        expect(body).toContain('Ingresos')
        expect(body).toContain('+12,4 %')
        expect(body).toContain('bg-success/10')
        expect(body).toContain('lucide-arrow-up-right')
    })

    it('variación negativa roja; sin variación no hay pastilla', () => {
        expect(html(Hero, { label: 'x', amount: 1, deltaPct: -3 })).toContain('bg-destructive/10')
        expect(html(Hero, { label: 'x', amount: 1 })).not.toContain('%')
    })

    it('tono negativo pinta la cifra en rojo; acepta texto en vez de monto', () => {
        expect(html(Hero, { label: 'x', amount: -1, tone: 'negative' })).toContain('text-destructive')
        expect(html(Hero, { label: 'x', text: '2.658' })).toContain('2.658')
    })
})

describe('Pill, EmptyState, ToolbarChip, SkeletonList', () => {
    it('Pill aplica el tono suave', () => {
        expect(html(Pill, { label: 'Vencido', tone: 'warning' })).toContain('bg-warning/[0.12]')
    })

    it('EmptyState de error se anuncia como alerta; el vacío no', () => {
        expect(html(EmptyState, { kind: 'error', title: 'Falló' })).toContain('role="alert"')
        const empty = html(EmptyState, { title: 'Nada', message: 'Sin datos', icon: Inbox })
        expect(empty).not.toContain('role="alert"')
        expect(empty).toContain('Sin datos')
    })

    it('ToolbarChip muestra el contador solo si hay filtros', () => {
        expect(html(ToolbarChip, { label: 'Filtros', onclick: () => {}, count: 2 })).toMatch(/>\s*2\s*</)
        expect(html(ToolbarChip, { label: 'Filtros', onclick: () => {} })).not.toContain('bg-primary px-1')
    })

    it('SkeletonList pinta tantas filas como se pidan y marca aria-busy', () => {
        const body = html(SkeletonList, { rows: 3 })
        expect(body).toContain('aria-busy="true"')
        expect(body.match(/class="row /g)).toHaveLength(3)
    })
})
