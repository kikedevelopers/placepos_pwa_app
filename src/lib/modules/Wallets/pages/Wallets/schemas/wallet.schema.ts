import { z } from 'zod'

/** Alta de billetera: nombre + saldo inicial (≥ 0). */
export const walletSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es requerido'),
    initial_balance: z.number().min(0, 'El monto no puede ser negativo')
})

export type WalletFormData = z.infer<typeof walletSchema>

export const walletDefaults = (): WalletFormData => ({
    name: '',
    initial_balance: 0
})

/** Edición de billetera: solo el nombre (paridad placepos). */
export const walletEditSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es requerido')
})

export type WalletEditData = z.infer<typeof walletEditSchema>
