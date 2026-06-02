import { fromStore } from 'svelte/store'
import type { ZodError } from 'zod'
import type { Customer, CustomerPayload } from '$lib/api/requests/customers'
import { getErrorMessage } from '$lib/utils/errors'
import { customerSchema, type CustomerFormData } from '../schemas/customer.schema'
import { useCustomerMutations } from './useCustomerMutations'

const blankToUndefined = (value: string): string | undefined => value.trim() || undefined

const toDefaults = (customer: Customer | null): CustomerFormData => ({
    person_type: customer?.person_type ?? 'INDIVIDUAL',
    name: customer?.name ?? '',
    doc_number: customer?.doc_number ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? ''
})

/** Aplana los issues de zod a un mapa por ruta. */
const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/**
 * Controlador del formulario de cliente con runes (equivalente al hook
 * react-hook-form + zodResolver de pos_app). Valida en vivo tras el primer
 * intento de envío.
 */
export function useCustomerForm(customer: Customer | null, onSuccess: () => void) {
    const { create, update } = useCustomerMutations()
    const c = fromStore(create)
    const u = fromStore(update)

    const form = $state<CustomerFormData>(toDefaults(customer))
    let attempted = $state(false)
    let submitError = $state('')
    const isEdit = !!customer

    const validation = $derived(customerSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        const data = validation.data

        const payload: CustomerPayload = {
            person_type: data.person_type,
            name: data.name.trim(),
            email: blankToUndefined(data.email),
            phone: blankToUndefined(data.phone),
            doc_number: blankToUndefined(data.doc_number),
            address: blankToUndefined(data.address)
        }

        const handlers = {
            onSuccess,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo guardar el cliente.')
        }

        if (isEdit && customer) {
            u.current.mutate({ id: customer.id, payload }, handlers)
        } else {
            c.current.mutate(payload, handlers)
        }
    }

    return {
        form,
        get errors() {
            return errors
        },
        submit,
        isEdit,
        get isSubmitting() {
            return c.current.isPending || u.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}
