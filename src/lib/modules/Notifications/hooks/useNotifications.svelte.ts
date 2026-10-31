import { fromStore, toStore } from 'svelte/store'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    getAppAlerts,
    getUnreadAlertsCount,
    markAlertRead,
    markAllAlertsRead,
    type AppAlertsList
} from '$lib/api/requests/appAlerts'

/** Todo cuelga de `['app-alerts']`: el tiempo real lo invalida de un golpe. */
export const NOTIFICATIONS_KEYS = {
    all: ['app-alerts'] as const,
    list: (unreadOnly: boolean) => ['app-alerts', 'list', { unreadOnly }] as const,
    unreadCount: ['app-alerts', 'unread-count'] as const
}

/** Lista de notificaciones (solo se pide con el panel abierto). */
export const useNotificationsList = (unreadOnly: boolean, enabled: () => boolean) =>
    fromStore(
        createQuery(
            toStore(() => ({
                queryKey: NOTIFICATIONS_KEYS.list(unreadOnly),
                queryFn: () => getAppAlerts(unreadOnly),
                enabled: enabled(),
                staleTime: 15_000
            }))
        )
    )

/**
 * Sin leer (badge de la campana). El tiempo real lo invalida al instante; el
 * intervalo es el respaldo si el socket se cae.
 */
export const useUnreadNotificationsCount = () => {
    const query = fromStore(
        createQuery({
            queryKey: NOTIFICATIONS_KEYS.unreadCount,
            queryFn: getUnreadAlertsCount,
            staleTime: 30_000,
            refetchInterval: 60_000,
            retry: false
        })
    )
    return {
        get count(): number {
            return query.current.data ?? 0
        }
    }
}

/** Marca leída una (optimista: sale de "Sin leer" al instante) o todas. */
export const useNotificationMutations = () => {
    const queryClient = useQueryClient()

    const markOne = fromStore(
        createMutation({
            mutationFn: (id: number) => markAlertRead(id),
            onMutate: async (id: number) => {
                await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEYS.all })
                queryClient.setQueriesData<AppAlertsList>(
                    { queryKey: ['app-alerts', 'list'] },
                    (current) => current && markReadIn(current, id)
                )
                queryClient.setQueryData<number>(NOTIFICATIONS_KEYS.unreadCount, (count) =>
                    Math.max(0, (count ?? 0) - 1)
                )
            },
            onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all })
        })
    )

    const markAll = fromStore(
        createMutation({
            mutationFn: () => markAllAlertsRead(),
            onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all })
        })
    )

    return {
        markRead: (id: number) => markOne.current.mutate(id),
        markAllRead: () => markAll.current.mutate(),
        get markingId(): number | null {
            return markOne.current.isPending ? (markOne.current.variables ?? null) : null
        },
        get isMarkingAll(): boolean {
            return markAll.current.isPending
        }
    }
}

/**
 * La lista con esa notificación marcada leída: en "Sin leer" desaparece, en
 * "Todas" queda leída. Pura (para el optimista).
 */
export const markReadIn = (list: AppAlertsList, id: number): AppAlertsList => {
    const target = list.alerts.find((alert) => alert.id === id)
    if (!target || target.is_read) return list
    return {
        unread_count: Math.max(0, list.unread_count - 1),
        alerts: list.alerts.map((alert) =>
            alert.id === id ? { ...alert, is_read: true, read_at: new Date().toISOString() } : alert
        )
    }
}
