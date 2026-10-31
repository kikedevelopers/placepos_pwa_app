import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { QueryClient } from '@tanstack/svelte-query'

const api = vi.hoisted(() => ({
    getAssistantProfile: vi.fn(),
    updateAssistantProfile: vi.fn(),
    suggestAssistantProfile: vi.fn()
}))
vi.mock('$lib/api/requests/productAssistant', () => api)
vi.mock('svelte-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
// El relacionado lee el catálogo; aquí no hace falta.
vi.mock('../hooks/useProducts', async () => {
    const { readable } = await import('svelte/store')
    return { useProducts: () => readable({ data: [] }) }
})

const { default: Harness } = await import('./AssistantProfileSheet.harness.test.svelte')

const EMPTY = { product_id: 7, description: '', uses: [], attributes: [], aliases: [], related: [], updated_at: null }

const settle = async () => {
    for (let i = 0; i < 5; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0))
        flushSync()
    }
}

/** Espera a que la ficha cargue (sale el esqueleto). */
const loaded = () =>
    vi.waitFor(
        () => {
            flushSync()
            if (!document.querySelector('#ap-description')) throw new Error('cargando')
        },
        { timeout: 2000, interval: 10 }
    )

const button = (label: string) =>
    [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(label) || b.getAttribute('aria-label') === label)

describe('AssistantProfileSheet (montado)', () => {
    let app: ReturnType<typeof mount> | null = null
    let onClose: ReturnType<typeof vi.fn>

    beforeEach(() => {
        api.getAssistantProfile.mockReset()
        api.suggestAssistantProfile.mockReset()
        api.getAssistantProfile.mockResolvedValue(EMPTY)
        onClose = vi.fn()
        window.matchMedia = vi.fn(() => ({ matches: true }) as unknown as MediaQueryList)
        app = mount(Harness, {
            target: document.body,
            props: { client: new QueryClient(), target: { id: 7, name: 'SALSA DE HUMO 500ML' }, onClose }
        })
    })

    afterEach(() => {
        if (app) unmount(app)
        app = null
    })

    it('al cargar la ficha no entra en bucle (el panel queda usable)', async () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
        await loaded()
        await settle()
        expect(errors).not.toHaveBeenCalled()
        expect(document.body.textContent).toContain('Empieza en segundos')
        errors.mockRestore()
    })

    it('la X cierra (sin cambios, sin preguntar)', async () => {
        await loaded()
        button('Cerrar')!.click()
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('"Completar con IA" llena la ficha y resalta lo propuesto', async () => {
        api.suggestAssistantProfile.mockResolvedValue({
            description: 'Salsa líquida con sabor ahumado.',
            uses: ['asados', 'hamburguesas'],
            attributes: [{ name: 'Contenido', value: '500 ml' }],
            aliases: ['humo líquido']
        })
        await loaded()
        button('Completar con IA')!.click()
        await settle()
        expect(api.suggestAssistantProfile).toHaveBeenCalledWith(7)
        const textarea = document.querySelector<HTMLTextAreaElement>('#ap-description')!
        expect(textarea.value).toBe('Salsa líquida con sabor ahumado.')
        expect(document.body.textContent).toContain('asados')
        expect(document.body.textContent).toContain('La IA propuso')
    })

    it('con cambios, la X pide confirmar en vez de cerrar', async () => {
        await loaded()
        const textarea = document.querySelector<HTMLTextAreaElement>('#ap-description')!
        textarea.value = 'Algo'
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        flushSync()
        button('Cerrar')!.click()
        flushSync()
        expect(onClose).not.toHaveBeenCalled()
        expect(document.body.textContent).toContain('¿Descartar los cambios?')
        // "Cancelar" vuelve a la ficha sin perder nada.
        button('Cancelar')!.click()
        await settle()
        expect(document.body.textContent).not.toContain('¿Descartar los cambios?')
        expect(document.querySelector<HTMLTextAreaElement>('#ap-description')!.value).toBe('Algo')
    })

    it('tras completar con IA, la X reacciona (pide confirmar y Descartar cierra)', async () => {
        api.suggestAssistantProfile.mockResolvedValue({
            description: 'Salsa ahumada.',
            uses: ['asados'],
            attributes: [],
            aliases: []
        })
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
        await loaded()
        button('Completar con IA')!.click()
        await settle()
        button('Cerrar')!.click()
        await settle()
        expect(errors).not.toHaveBeenCalled()
        expect(document.body.textContent).toContain('¿Descartar los cambios?')
        button('Descartar y cerrar')!.click()
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(onClose).toHaveBeenCalledTimes(1)
        errors.mockRestore()
    })
})
