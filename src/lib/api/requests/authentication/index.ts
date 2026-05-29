import api from '$lib/api/config'
import type { LoginPayload, LoginResponse, ProfileResponse } from './types'

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post('/auth/user', payload)
    return response.data
}

export const getProfile = async (): Promise<ProfileResponse> => {
    const response = await api.get('/auth/profile')
    return response.data
}
