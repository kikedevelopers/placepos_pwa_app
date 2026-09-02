import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios, { type AxiosAdapter } from 'axios'

/**
 * Test de REGRESIÓN del bug más caro de esta feature.
 *
 * La instancia de axios de la PWA (`api/config.ts`) declara
 * `Content-Type: application/json` por defecto. Con ese header, el `transformRequest` de axios convierte un
 * FormData en JSON (`{"image":{}}`): el archivo se pierde ENTERO y el servidor
 * responde siempre "Debes seleccionar una imagen". Ningún test de UI lo detecta
 * porque todos mockean la función de request.
 *
 * Aquí se observa el body en el ADAPTER, que es el único punto posterior a
 * `transformRequest` — un interceptor todavía ve el FormData intacto y daría un
 * falso verde.
 *
 * Corre bajo el entorno `node` por defecto del proyecto (no hace falta pedir
 * un DOM emulado aquí): `File`/`FormData` son globales nativos desde Node 18,
 * y el `adapter` propio evita que axios necesite un navegador real.
 */

/** Captura la config con la que el adapter recibiría la petición. */
function captureRequest(post: (instance: ReturnType<typeof axios.create>) => Promise<unknown>) {
    let captured: { contentType: unknown; data: unknown } | null = null

    const adapter: AxiosAdapter = (config) => {
        captured = {
            contentType: config.headers.get?.('Content-Type') ?? config.headers['Content-Type'],
            data: config.data
        }
        return Promise.reject(new Error('stop'))
    }

    const instance = axios.create({
        baseURL: 'http://localhost:3800',
        // Mismo default que `api/config.ts` — es la causa del bug.
        headers: { 'Content-Type': 'application/json' },
        adapter
    })

    return post(instance)
        .catch(() => undefined)
        .then(() => captured)
}

function imageForm(): FormData {
    const form = new FormData()
    form.append('image', new File([new Uint8Array([0xff, 0xd8, 0xff])], 'foto.jpg', {
        type: 'image/jpeg'
    }))
    return form
}

beforeEach(() => {
    vi.restoreAllMocks()
})

describe('uploadProductImage · el archivo tiene que llegar como multipart', () => {
    it('SIN anular el Content-Type, axios serializa el FormData a JSON (el bug)', async () => {
        const captured = await captureRequest((instance) =>
            instance.post('/inventory/1/image', imageForm())
        )

        // Esto documenta POR QUÉ hace falta el override: si algún día axios deja
        // de comportarse así, este test avisa de que la razón cambió.
        expect(typeof captured?.data).toBe('string')
        expect(captured?.data).toContain('"image"')
    })

    it('anulando el Content-Type el body viaja como FormData', async () => {
        const captured = await captureRequest((instance) =>
            instance.post('/inventory/1/image', imageForm(), {
                headers: { 'Content-Type': undefined }
            })
        )

        expect(captured?.data).toBeInstanceOf(FormData)
        expect(typeof captured?.data).not.toBe('string')
    })

    it('el FormData conserva el archivo bajo el campo `image`', async () => {
        const captured = await captureRequest((instance) =>
            instance.post('/inventory/1/image', imageForm(), {
                headers: { 'Content-Type': undefined }
            })
        )

        const sent = captured?.data as FormData
        const file = sent.get('image') as File
        expect(file).toBeInstanceOf(File)
        expect(file.name).toBe('foto.jpg')
        expect(file.type).toBe('image/jpeg')
    })

    it('NO se fija multipart/form-data a mano (iría sin boundary)', async () => {
        // Documenta la alternativa descartada: el header queda escrito sin
        // `boundary` y el servidor no puede separar las partes.
        const captured = await captureRequest((instance) =>
            instance.post('/inventory/1/image', imageForm(), {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        )

        expect(String(captured?.contentType)).not.toContain('boundary')
    })
})
