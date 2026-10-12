/**
 * Markdown → HTML compacto y SEGURO para las respuestas de Place.
 *
 * Se escapa TODO el HTML de entrada ANTES de aplicar el formato, así el `{@html}`
 * del componente solo inserta las etiquetas que genera esta función (no las del
 * modelo). Cubre lo que el asistente usa de verdad: encabezados, negrita/itálica,
 * código en línea y en bloque, listas (viñetas y numeradas), tablas GFM, citas,
 * separadores y enlaces http(s). Devuelve una cadena de HTML.
 */

const escapeHtml = (s: string): string =>
    s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

/** Formato en línea sobre texto YA escapado. */
const inline = (text: string): string =>
    text
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
        // Enlaces [texto](url): solo http/https (el texto ya viene escapado).
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label: string, url: string) => {
            const safe = url.replace(/"/g, '%22')
            return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`
        })

const splitRow = (line: string): string[] =>
    line
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map((c) => c.trim())

const isTableSep = (line: string): boolean => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-')

export const renderMarkdown = (input: string): string => {
    const src = (input ?? '').replace(/\r\n/g, '\n')
    const lines = src.split('\n')
    const out: string[] = []
    let i = 0

    const flushParagraph = (buf: string[]): void => {
        if (buf.length === 0) return
        out.push(`<p>${inline(escapeHtml(buf.join(' ')))}</p>`)
        buf.length = 0
    }

    const paragraph: string[] = []

    while (i < lines.length) {
        const line = lines[i]

        // Bloque de código ``` ... ```
        if (/^```/.test(line)) {
            flushParagraph(paragraph)
            const code: string[] = []
            i++
            while (i < lines.length && !/^```/.test(lines[i])) {
                code.push(lines[i])
                i++
            }
            i++ // cierre ```
            out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
            continue
        }

        // Tabla GFM: cabecera + fila separadora + filas
        if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            flushParagraph(paragraph)
            const header = splitRow(line)
            i += 2 // cabecera + separador
            const rows: string[][] = []
            while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
                rows.push(splitRow(lines[i]))
                i++
            }
            const thead = `<thead><tr>${header.map((c) => `<th>${inline(escapeHtml(c))}</th>`).join('')}</tr></thead>`
            const tbody = `<tbody>${rows
                .map((r) => `<tr>${r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join('')}</tr>`)
                .join('')}</tbody>`
            out.push(`<table>${thead}${tbody}</table>`)
            continue
        }

        // Encabezados
        const heading = /^(#{1,6})\s+(.*)$/.exec(line)
        if (heading) {
            flushParagraph(paragraph)
            const level = Math.min(heading[1].length + 2, 6) // # → h3, para no gritar en un chat
            out.push(`<h${level}>${inline(escapeHtml(heading[2].trim()))}</h${level}>`)
            i++
            continue
        }

        // Separador
        if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
            flushParagraph(paragraph)
            out.push('<hr />')
            i++
            continue
        }

        // Lista con viñetas
        if (/^\s*[-*+]\s+/.test(line)) {
            flushParagraph(paragraph)
            const items: string[] = []
            while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
                items.push(`<li>${inline(escapeHtml(lines[i].replace(/^\s*[-*+]\s+/, '')))}</li>`)
                i++
            }
            out.push(`<ul>${items.join('')}</ul>`)
            continue
        }

        // Lista numerada
        if (/^\s*\d+[.)]\s+/.test(line)) {
            flushParagraph(paragraph)
            const items: string[] = []
            while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
                items.push(`<li>${inline(escapeHtml(lines[i].replace(/^\s*\d+[.)]\s+/, '')))}</li>`)
                i++
            }
            out.push(`<ol>${items.join('')}</ol>`)
            continue
        }

        // Cita
        if (/^\s*>\s?/.test(line)) {
            flushParagraph(paragraph)
            const quote: string[] = []
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                quote.push(lines[i].replace(/^\s*>\s?/, ''))
                i++
            }
            out.push(`<blockquote>${inline(escapeHtml(quote.join(' ')))}</blockquote>`)
            continue
        }

        // Línea en blanco → cierra párrafo
        if (line.trim() === '') {
            flushParagraph(paragraph)
            i++
            continue
        }

        // Texto normal (se acumula en párrafo)
        paragraph.push(line.trim())
        i++
    }

    flushParagraph(paragraph)
    return out.join('\n')
}
