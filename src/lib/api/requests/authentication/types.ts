export type LoginPayload = {
    username: string
    password: string
}

export type AuthUser = {
    id: number
    name: string
    lastname: string
    email: string
    type: string
}

export type LoginResponse = {
    success: boolean
    payload?: {
        access_token: string
        user: AuthUser
    }
    error?: string
    message?: string
}

export type CompanyProfile = {
    id: number
    name: string
    is_branch: boolean
    balance: number
    document_number: string | null
    address: string | null
    email: string | null
    phone_number: string | null
    created_at: string
    updated_at: string
}

export type UserProfile = {
    id: number
    name: string
    lastname: string
    email: string
    type: string
    created_at: string
}

export type ProfileResponse = {
    success: boolean
    payload?: {
        company_profile: {
            primary: CompanyProfile | null
            companies: CompanyProfile[]
        }
        user_profile: UserProfile
    }
    error?: string
}
