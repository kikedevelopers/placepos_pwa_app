import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    HEADER_BACKGROUND_STYLE,
    HEADER_GRADIENT,
    STATUS_BAR_COLOR,
    prefersLightStatusText,
    relativeLuminance
} from './statusBar'

// La app se dibuja detrás de la barra de estado del móvil. Si el color de la
// barra (theme-color / manifest) y el del código se separan, vuelve a verse una
// franja de otro color arriba; si el modo de iOS no es translúcido, vuelve el
// tope opaco. Este test los mantiene juntos.

const ROOT = resolve(__dirname, '..', '..', '..')
const appHtml = readFileSync(resolve(ROOT, 'src', 'app.html'), 'utf8')
const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf8')

describe('barra de estado', () => {
    it('iOS dibuja la app detrás del reloj (black-translucent) con viewport-fit=cover', () => {
        expect(appHtml).toMatch(/name="apple-mobile-web-app-status-bar-style"\s+content="black-translucent"/)
        expect(appHtml).toMatch(/viewport-fit=cover/)
    })

    it('theme-color (Android) es el mismo azul del código', () => {
        expect(appHtml).toContain(`name="theme-color" content="${STATUS_BAR_COLOR}"`)
    })

    it('el manifest usa el mismo azul', () => {
        expect(viteConfig).toContain(`theme_color: '${STATUS_BAR_COLOR}'`)
    })

    it('el header arranca exactamente en ese azul (la junta no se ve)', () => {
        expect(HEADER_GRADIENT).toMatch(new RegExp(`^linear-gradient\\(180deg, ${STATUS_BAR_COLOR} 0%`))
    })

    it('el header es plano en el color de la barra en su mitad superior (sin costura)', () => {
        expect(HEADER_GRADIENT).toContain(`${STATUS_BAR_COLOR} 0%, ${STATUS_BAR_COLOR} 45%`)
    })

    it('con este azul la hora del sistema sale en BLANCO (contrasta más que el negro)', () => {
        expect(prefersLightStatusText(STATUS_BAR_COLOR)).toBe(true)
    })

    it('el azul anterior (#1e7df0) daba hora NEGRA: por eso se cambió', () => {
        expect(prefersLightStatusText('#1e7df0')).toBe(false)
    })

    it('luminancia: extremos y entrada inválida', () => {
        expect(relativeLuminance('#000000')).toBe(0)
        expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
        expect(prefersLightStatusText('#ffffff')).toBe(false)
        expect(prefersLightStatusText('#000000')).toBe(true)
        expect(() => relativeLuminance('azul')).toThrow('Color inválido')
        expect(() => relativeLuminance('#fff')).toThrow()
    })

    it('iOS 26 toma el color del header: background-color SÓLIDO = el azul de la barra', () => {
        // iOS 26 lee background-color (no degradados) de un elemento sticky/fixed.
        expect(HEADER_BACKGROUND_STYLE).toMatch(new RegExp(`^background-color:${STATUS_BAR_COLOR};`))
        expect(HEADER_BACKGROUND_STYLE).toContain(`background-image:${HEADER_GRADIENT}`)
    })

    it('el header es sticky arriba (iOS 26 solo considera fixed/sticky)', () => {
        const header = readFileSync(resolve(ROOT, 'src', 'lib', 'components', 'AppHeader.svelte'), 'utf8')
        expect(header).toMatch(/<header\s+class="sticky top-0/)
        expect(header).toContain('style={HEADER_BACKGROUND_STYLE}')
    })

    it('app.css es CSS válido (un error de llaves tumba toda la app en dev)', async () => {
        const postcss = (await import('postcss')).default
        const css = readFileSync(resolve(ROOT, 'src', 'app.css'), 'utf8')
        expect(() => postcss.parse(css)).not.toThrow()
    })

    it('iOS instalado: html y el shell miden la pantalla completa (WebKit 301108)', () => {
        const css = readFileSync(resolve(ROOT, 'src', 'app.css'), 'utf8')
        const ios = css.slice(css.indexOf('html.ios-standalone {'))
        // Alto mínimo CON TOPE (frappe-ui): 100lvh solo sobremide en iOS 26
        // (WebKit 316008) y dejaba el dock cortado abajo en producción.
        expect(ios).toMatch(/min-height: min\(100lvh, calc\(100% \+ env\(safe-area-inset-top\)\)\)/)
        expect(ios).not.toMatch(/--app-height: 100lvh/)
        expect(css).not.toMatch(/html\.ios-standalone body/)
        // Sin respaldo fijo: si la barra es opaca (inset 0) un mínimo de 50px
        // dejaba una banda azul vacía bajo la hora.
        expect(ios).not.toMatch(/--app-safe-top: max\(/)
    })

    it('app.html marca iOS instalado con las dos señales (display-mode y navigator.standalone)', () => {
        expect(appHtml).toContain("classList.add('ios-standalone')")
        expect(appHtml).toContain('navigator.standalone === true')
        expect(appHtml).toContain("matchMedia('(display-mode: standalone)')")
    })

    it('ningún componente usa env(safe-area-inset-top) ni 100dvh directo (todo pasa por las variables)', () => {
        const { execSync } = require('node:child_process') as typeof import('node:child_process')
        const hits = execSync(
            `grep -rln "env(safe-area-inset-top)\\|h-\\[100dvh\\]" ${resolve(ROOT, 'src', 'lib')} ${resolve(ROOT, 'src', 'routes')} || true`,
            { encoding: 'utf8' }
        ).trim()
        expect(hits).toBe('')
    })
})
