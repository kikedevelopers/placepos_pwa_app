import { fromStore, toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getSalesAgentAccess } from '$lib/api/requests/salesBot'
import { getAgentOrdersPendingCount } from '$lib/api/requests/agentOrders'
import { usePermissions } from '$lib/hooks/usePermissions.svelte'
import { AGENT_ORDERS_KEYS } from '../constants'

export const SALES_AGENT_ACCESS_KEY = ['sales-bot', 'access'] as const

/**
 * ¿El negocio tiene el asistente de ventas? (lo habilita el superadmin). Ante
 * un error se asume que no (fail-closed). Debe llamarse al inicializar un
 * componente.
 */
export const useSalesAgentEnabled = () => {
    const query = fromStore(
        createQuery({
            queryKey: SALES_AGENT_ACCESS_KEY,
            queryFn: getSalesAgentAccess,
            staleTime: 60_000,
            retry: false
        })
    )
    return {
        get enabled(): boolean {
            return query.current.data?.enabled === true
        },
        get isLoading(): boolean {
            return query.current.isLoading
        }
    }
}

/**
 * ¿El usuario ve los pedidos del agente? Igual que el servidor y placepos: con
 * el agente habilitado y a nivel administrador.
 */
export const useAgentOrdersAccess = () => {
    const permissions = usePermissions()
    const agent = useSalesAgentEnabled()
    return {
        get enabled(): boolean {
            return agent.enabled && permissions.isAdminLevel
        }
    }
}

/**
 * Pedidos por tomar (badge de la pestaña "Agente"). Se refresca al instante por
 * tiempo real; el intervalo es el respaldo si el socket se cae.
 */
export const useAgentOrdersPendingCount = (enabled: () => boolean) => {
    const query = fromStore(
        createQuery(
            toStore(() => ({
                queryKey: AGENT_ORDERS_KEYS.pendingCount,
                queryFn: getAgentOrdersPendingCount,
                enabled: enabled(),
                staleTime: 30_000,
                refetchInterval: 120_000,
                retry: false
            }))
        )
    )
    return {
        get count(): number {
            return enabled() ? (query.current.data ?? 0) : 0
        }
    }
}
