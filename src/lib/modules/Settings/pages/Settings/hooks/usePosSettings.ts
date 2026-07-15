import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    getPosMargins,
    updatePosMargins,
    getStrictInventory,
    updateStrictInventory,
    getIncludeOrdersInReports,
    updateIncludeOrdersInReports,
    type PosMarginsConfig,
    type StrictInventoryConfig,
    type IncludeOrdersInReportsConfig
} from '$lib/api/requests/appSettings'
import { SETTINGS_KEYS } from '../constants/queryKeys'

export const usePosMargins = () =>
    createQuery({ queryKey: SETTINGS_KEYS.posMargins, queryFn: getPosMargins })

export const useUpdatePosMargins = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: PosMarginsConfig) => updatePosMargins(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(SETTINGS_KEYS.posMargins, data)
            queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.posMargins })
        }
    })
}

export const useStrictInventory = () =>
    createQuery({ queryKey: SETTINGS_KEYS.strictInventory, queryFn: getStrictInventory })

export const useUpdateStrictInventory = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: StrictInventoryConfig) => updateStrictInventory(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(SETTINGS_KEYS.strictInventory, data)
            queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.strictInventory })
        }
    })
}

export const useIncludeOrdersInReports = () =>
    createQuery({
        queryKey: SETTINGS_KEYS.includeOrdersInReports,
        queryFn: getIncludeOrdersInReports
    })

export const useUpdateIncludeOrdersInReports = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: IncludeOrdersInReportsConfig) => updateIncludeOrdersInReports(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(SETTINGS_KEYS.includeOrdersInReports, data)
            queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.includeOrdersInReports })
        }
    })
}
