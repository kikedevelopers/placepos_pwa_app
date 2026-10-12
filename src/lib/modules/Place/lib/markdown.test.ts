import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'
import { parseStreamFrame, splitSseFrames } from './sse'

describe('renderMarkdown', () => {
    it('escapa HTML del modelo (no se inyecta markup ajeno)', () => {
        const html = renderMarkdown('Hola <script>alert(1)</script> & "x"')
        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;script&gt;')
        expect(html).toContain('&amp;')
    })

    it('negrita, itálica y código en línea', () => {
        const html = renderMarkdown('Esto es **fuerte**, *suave* y `code`.')
        expect(html).toContain('<strong>fuerte</strong>')
        expect(html).toContain('<em>suave</em>')
        expect(html).toContain('<code>code</code>')
    })

    it('listas con viñetas y numeradas', () => {
        expect(renderMarkdown('- uno\n- dos')).toContain('<ul><li>uno</li><li>dos</li></ul>')
        expect(renderMarkdown('1. uno\n2. dos')).toContain('<ol><li>uno</li><li>dos</li></ol>')
    })

    it('tabla GFM → <table> con thead y tbody', () => {
        const md = ['| Producto | Stock |', '| --- | --- |', '| Ajo | -5 |', '| Linaza | -2 |'].join('\n')
        const html = renderMarkdown(md)
        expect(html).toContain('<table>')
        expect(html).toContain('<th>Producto</th>')
        expect(html).toContain('<td>Ajo</td>')
        expect(html).toContain('<td>-2</td>')
    })

    it('encabezado # se degrada a h3 (no grita en un chat)', () => {
        expect(renderMarkdown('# Título')).toContain('<h3>Título</h3>')
    })

    it('enlaces solo http(s)', () => {
        expect(renderMarkdown('[web](https://x.com)')).toContain(
            '<a href="https://x.com" target="_blank" rel="noopener noreferrer">web</a>'
        )
        // Un esquema peligroso no se convierte en enlace.
        expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('<a ')
    })
})

describe('SSE (parser del stream)', () => {
    it('arma eventos delta y conserva la trama incompleta', () => {
        const { frames, rest } = splitSseFrames('event: delta\ndata: {"text":"ho"}\n\nevent: delta\ndata: {"text":"la"')
        expect(frames).toHaveLength(1)
        expect(parseStreamFrame(frames[0])).toEqual({ type: 'delta', text: 'ho' })
        expect(rest).toContain('"la"')
    })

    it('ignora heartbeats y JSON corrupto sin romper el stream', () => {
        const { frames } = splitSseFrames(': keep-alive\n\nevent: delta\ndata: {bad json}\n\n')
        // El heartbeat no produce frame; el JSON malo produce frame pero parsea a null.
        expect(parseStreamFrame(frames[0])).toBeNull()
    })

    it('evento done con notice', () => {
        const { frames } = splitSseFrames('event: done\ndata: {"notice":"corte"}\n\n')
        expect(parseStreamFrame(frames[0])).toEqual({ type: 'done', notice: 'corte' })
    })
})
