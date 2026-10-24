import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import VirtualList from '../VirtualList.svelte'

const SRC = resolve(__dirname, '..', '..', '..')
const read = (...p: string[]) => readFileSync(resolve(SRC, ...p), 'utf8')

describe('layout de la app: dock flotante y sheets', () => {
    const layout = read('routes', '(app)', '+layout.svelte')
    const css = read('app.css')

    it('<main> NO lleva z-index (si no, los sheets quedan bajo el dock)', () => {
        const main = /<main\s[^>]*>/s.exec(layout)?.[0] ?? ''
        expect(main).toContain('app-main')
        expect(main).not.toMatch(/\bz-\[?\d/)
    })

    it('ningún sheet se renderiza dentro del header sticky (quedaría bajo <main>)', () => {
        const header = read('lib', 'components', 'AppHeader.svelte')
        const inside = header.slice(header.indexOf('<header'), header.indexOf('</header>'))
        expect(header).toMatch(/<header\s+class="sticky/)
        expect(inside).not.toMatch(/<\w*Sheet\b/)
        expect(header.slice(header.indexOf('</header>'))).toContain('<SettingsSheet')
    })

    it('los shells de pantalla completa son fixed inset-0 (miden el área visible real, sin vh)', () => {
        expect(/<main\s[^>]*>/s.test(layout)).toBe(true)
        expect(layout).toContain('<div class="fixed inset-0 flex flex-col overflow-hidden bg-background">')
        expect(read('routes', 'place', '+page.svelte')).toContain('<div class="fixed inset-0 flex flex-col')
        expect(read('lib', 'modules', 'POS', 'pages', 'Pos', 'Pos.svelte')).toContain('<div class="fixed inset-0 flex flex-col')
        const code = (src: string) => src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\/.*$/gm, '')
        for (const shell of [layout, read('routes', 'place', '+page.svelte'), read('lib', 'modules', 'POS', 'pages', 'Pos', 'Pos.svelte')].map(code)) {
            expect(shell).not.toMatch(/h-\[var\(--app-height\)\]/)
            expect(shell).not.toMatch(/100lvh/)
        }
    })

    it('el dock va por debajo de los sheets', () => {
        const dock = read('lib', 'components', 'tabbar', 'FloatingDock.svelte')
        const sheet = read('lib', 'components', 'BottomSheet.svelte')
        expect(dock).toContain('z-40')
        expect(sheet).toMatch(/fixed inset-0 z-50/)
    })

    it('BottomSheet y SettingsSheet se montan en <body> (portal): nada los atrapa', () => {
        expect(read('lib', 'components', 'BottomSheet.svelte')).toMatch(/<div use:portal class="fixed inset-0 z-50/)
        // El menú de Ajustes usa BottomSheet (y con él, el portal).
        expect(read('lib', 'components', 'SettingsSheet.svelte')).toMatch(/<BottomSheet \{open\}/)
    })

    it('la hoja reserva el alto del dock, salvo las vistas con scroll propio', () => {
        expect(css).toMatch(/--dock-space: calc\(84px \+ max\(env\(safe-area-inset-bottom\), 12px\)\)/)
        expect(css).toMatch(/\.app-main \{\s*padding-bottom: var\(--dock-space\);/)
        expect(css).toMatch(/\.app-main:has\(\.dock-bleed\) \{\s*padding-bottom: 0;/)
    })

    it('Inventario (lista virtual) usa dock-bleed y reserva el dock dentro de su scroll', () => {
        const inv = read('lib', 'modules', 'Inventory', 'pages', 'Inventory', 'Inventory.svelte')
        expect(inv).toContain('dock-bleed')
        expect(inv).toContain('tailSpace="calc(var(--dock-space) + 8px)"')
    })
})

describe('VirtualList', () => {
    it('agrega el espacio final pedido (para que la última fila suba sobre el dock)', () => {
        const body = render(VirtualList as never, {
            props: { items: [1, 2, 3], getKey: (n: number) => n, estimateHeight: 72, tailSpace: 'var(--dock-space)', children: (() => {}) as never }
        } as never).body
        expect(body).toContain('data-testid="virtual-tail"')
        expect(body).toContain('height:var(--dock-space)')
    })

    it('sin tailSpace no agrega nada', () => {
        const body = render(VirtualList as never, {
            props: { items: [], getKey: (n: number) => n, estimateHeight: 72, children: (() => {}) as never }
        } as never).body
        expect(body).not.toContain('virtual-tail')
    })
})
