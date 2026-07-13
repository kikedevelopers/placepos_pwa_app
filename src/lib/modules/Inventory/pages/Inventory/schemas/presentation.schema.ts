import { z } from 'zod'

const BARCODE_REGEX = /^[a-zA-Z0-9]*$/

/**
 * Modos de medida de la presentación (espejo de placepos `pricing_mode`):
 *  - `packaging`: empaque fijo (factor por unidad = value del empaque).
 *  - `quantity`: peso variable, se ingresa la cantidad por unidad.
 *  - `from_price`: peso variable, la cantidad se calcula desde el precio más alto.
 */
export const PRICING_MODE = {
    PACKAGING: 'packaging',
    QUANTITY: 'quantity',
    FROM_PRICE: 'from_price'
} as const
export type PricingMode = (typeof PRICING_MODE)[keyof typeof PRICING_MODE]

const priceSchema = z.object({
    id: z.number().optional(),
    sale_price: z.number({ message: 'El precio es requerido' }).min(0, 'Debe ser ≥ 0'),
    profit: z.number(),
    margin: z.number()
})

export const presentationSchema = z
    .object({
        name: z.string().trim().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
        sku_code: z.string().trim().max(50, 'Máximo 50 caracteres'),
        bar_code: z
            .string()
            .trim()
            .max(50, 'Máximo 50 caracteres')
            .regex(BARCODE_REGEX, 'Solo se permiten letras y números'),
        description: z.string().trim().max(500, 'Máximo 500 caracteres'),
        parent_id: z.number().int().positive('Selecciona un producto base'),
        show_in_pos: z.boolean(),
        pricing_mode: z.enum(['packaging', 'quantity', 'from_price']),
        packaging_id: z.number().int().positive().nullable(),
        packaging_value: z.number(),
        prices: z.array(priceSchema).min(1, 'Agrega al menos un precio').max(4, 'Máximo 4 precios')
    })
    .superRefine((data, ctx) => {
        if (data.pricing_mode === 'packaging') {
            if (!data.packaging_id || data.packaging_id <= 0) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['packaging_id'],
                    message: 'El empaque es obligatorio'
                })
            }
        } else if (!(data.packaging_value > 0)) {
            ctx.addIssue({
                code: 'custom',
                path: ['packaging_value'],
                message: 'La cantidad debe ser mayor que 0'
            })
        }
    })

export type PresentationFormData = z.infer<typeof presentationSchema>
