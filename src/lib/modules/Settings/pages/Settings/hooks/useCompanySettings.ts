import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { getCompany, updateCompany, type UpdateCompanyPayload } from '$lib/api/requests/company'
import { SETTINGS_KEYS } from '../constants/queryKeys'

export const useCompany = () =>
    createQuery({ queryKey: SETTINGS_KEYS.company, queryFn: getCompany })

export const useUpdateCompany = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: ({ companyId, payload }: { companyId: number; payload: UpdateCompanyPayload }) =>
            updateCompany(companyId, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.company })
    })
}
