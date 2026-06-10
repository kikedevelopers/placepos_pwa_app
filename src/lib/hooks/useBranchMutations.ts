import { createMutation } from '@tanstack/svelte-query'

import {
    createBranch,
    setActiveBranches,
    switchBranch,
    type CreateBranchPayload
} from '$lib/api/requests/branches'
import { queryClient } from '$lib/api/queryClient'
import { setAuthToken } from '$lib/api/storage'
import { PROFILE_QUERY_KEY } from '$lib/hooks/useProfile'
import { auth } from '$lib/stores/auth.svelte'

/**
 * Crea una sucursal. Tras crearla invalida el perfil para que el selector
 * muestre la nueva company en la lista.
 */
export const useCreateBranch = () =>
    createMutation({
        mutationFn: (payload: CreateBranchPayload) => createBranch(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
        }
    })

/**
 * Cambia de sucursal: guarda el nuevo token (re-emitido con la company elegida)
 * y recarga la ventana para rehidratar toda la app con el contexto aislado.
 */
export const useSwitchBranch = () =>
    createMutation({
        mutationFn: (companyId: number) => switchBranch(companyId),
        onSuccess: async ({ access_token }) => {
            await setAuthToken(access_token)
            auth.setToken(access_token)
            window.location.reload()
        }
    })

/**
 * Reconciliación de sucursales activas (modal bloqueante). Tras guardar, recarga
 * para rehidratar el perfil con el nuevo estado.
 */
export const useSetActiveBranches = () =>
    createMutation({
        mutationFn: (companyIds: number[]) => setActiveBranches(companyIds),
        onSuccess: () => {
            window.location.reload()
        }
    })
