import { z } from 'zod'

export const ACCOUNT_TYPE = {
    SAVINGS: 'savings',
    CHECKING: 'checking'
} as const

export type AccountTypeValue = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE]

/** Alta de cuenta bancaria. */
export const bankAccountSchema = z.object({
    name: z.string().trim().min(1, 'El nombre de la entidad es requerido'),
    account_number: z.string().trim().min(1, 'El número de cuenta es requerido'),
    account_type: z.enum([ACCOUNT_TYPE.SAVINGS, ACCOUNT_TYPE.CHECKING], {
        message: 'Seleccione un tipo de cuenta'
    }),
    initial_balance: z.number().min(0, 'El monto no puede ser negativo'),
    available_in_pos: z.boolean()
})

export type BankAccountFormData = z.infer<typeof bankAccountSchema>

export const bankDefaults = (): BankAccountFormData => ({
    name: '',
    account_number: '',
    account_type: ACCOUNT_TYPE.SAVINGS,
    initial_balance: 0,
    available_in_pos: false
})

/** Edición de cuenta bancaria (sin saldo inicial). */
export const bankEditSchema = bankAccountSchema.omit({ initial_balance: true })

export type BankEditData = z.infer<typeof bankEditSchema>

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeValue, string> = {
    savings: 'Ahorro',
    checking: 'Corriente'
}
