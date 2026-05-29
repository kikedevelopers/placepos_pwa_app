import { z } from 'zod'
import { parseDecimal } from '$lib/utils/numbers'

const BARCODE_REGEX = /^[a-zA-Z0-9]*$/

// Stock como string (input de texto; acepta coma o punto, máx 4 decimales).
const stockField = z
    .string()
    .trim()
    .min(1, 'Requerido')
    .refine((v) => {
        const n = parseDecimal(v)
        return !isNaN(n) && n >= 0
    }, 'Número inválido (≥ 0)')
    .refine((v) => {
        const decimals = v.replace(',', '.').split('.')[1]
        return !decimals || decimals.length <= 4
    }, 'Máximo 4 decimales')

// cost y prices son `number` (los maneja MoneyInput). profit/margin se recalculan.
const priceSchema = z.object({
    id: z.number().optional(),
    sale_price: z.number({ message: 'El precio es requerido' }).min(0, 'Debe ser ≥ 0'),
    profit: z.number(),
    margin: z.number()
})

export const productSchema = z
    .object({
        name: z.string().trim().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
        sku_code: z.string().trim().max(50, 'Máximo 50 caracteres'),
        bar_code: z
            .string()
            .trim()
            .max(50, 'Máximo 50 caracteres')
            .regex(BARCODE_REGEX, 'Solo se permiten letras y números'),
        description: z.string().trim().max(500, 'Máximo 500 caracteres'),
        category_id: z.number().int().positive().nullable(),
        packaging_id: z.number().int().positive().nullable(),
        show_in_pos: z.boolean(),
        is_purchasable: z.boolean(),
        stock: stockField,
        cost: z.number({ message: 'El costo es requerido' }).min(0, 'Debe ser ≥ 0'),
        prices: z.array(priceSchema).min(1, 'Agrega al menos un precio').max(4, 'Máximo 4 precios')
    })
    .superRefine((data, ctx) => {
        data.prices.forEach((price, i) => {
            if (price.sale_price < data.cost) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['prices', i, 'sale_price'],
                    message: 'Debe ser ≥ al costo'
                })
            }
        })
    })

export type ProductFormData = z.infer<typeof productSchema>
