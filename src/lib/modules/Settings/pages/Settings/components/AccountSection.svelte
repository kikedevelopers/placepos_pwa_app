<script lang="ts">
    import { KeyRound, Save, ShieldCheck, UserRound } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { getErrorMessage } from '$lib/utils/errors'
    import FormField from '$lib/components/FormField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import StatusBanner from '$lib/components/StatusBanner.svelte'
    import SectionHeader from './SectionHeader.svelte'
    import {
        personalInfoSchema,
        securitySchema,
        securityDefaults,
        type PersonalInfoFormData,
        type SecurityFormData
    } from '../schemas/account'
    import { useUpdateMe, useChangePassword } from '../hooks/useAccountSettings'

    let { onBack }: { onBack: () => void } = $props()

    const profileQuery = useProfile()
    const updateMe = useUpdateMe()
    const changePassword = useChangePassword()

    const user = $derived($profileQuery.data?.payload?.user_profile ?? null)
    const initials = $derived(
        user ? `${user.name?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase() || 'U' : 'U'
    )

    const ROLE_LABEL: Record<string, string> = {
        owner: 'Propietario',
        superadmin: 'Superadministrador',
        manager: 'Administrador',
        employee: 'Empleado'
    }

    const buildErrors = (issues: { path: (string | number)[]; message: string }[]) => {
        const map: Record<string, string> = {}
        for (const issue of issues) {
            const key = issue.path.join('.')
            if (!(key in map)) map[key] = issue.message
        }
        return map
    }

    // ----- Información personal -----
    let info = $state<PersonalInfoFormData>({ name: '', lastname: '', email: '' })
    let infoSeeded = $state(false)
    let infoAttempted = $state(false)
    let infoError = $state('')
    let infoSaved = $state(false)

    // Siembra inicial desde el perfil (una vez que carga).
    $effect(() => {
        if (user && !infoSeeded) {
            info.name = user.name ?? ''
            info.lastname = user.lastname ?? ''
            info.email = user.email ?? ''
            infoSeeded = true
        }
    })

    const infoValidation = $derived(personalInfoSchema.safeParse($state.snapshot(info)))
    const infoErrors = $derived(
        infoAttempted && !infoValidation.success ? buildErrors(infoValidation.error.issues) : {}
    )
    const infoDirty = $derived(
        !!user &&
            (info.name.trim() !== (user.name ?? '') ||
                info.lastname.trim() !== (user.lastname ?? '') ||
                info.email.trim() !== (user.email ?? ''))
    )

    const submitInfo = () => {
        infoAttempted = true
        infoError = ''
        infoSaved = false
        if (!infoValidation.success) return
        const data = infoValidation.data
        $updateMe.mutate(
            { name: data.name, lastname: data.lastname, email: data.email },
            {
                onSuccess: () => {
                    infoSaved = true
                    infoAttempted = false
                },
                onError: (e) =>
                    (infoError = getErrorMessage(e) ?? 'No se pudo actualizar el perfil.')
            }
        )
    }

    // ----- Seguridad -----
    let sec = $state<SecurityFormData>(securityDefaults())
    let secAttempted = $state(false)
    let secError = $state('')
    let secSaved = $state(false)

    const secValidation = $derived(securitySchema.safeParse($state.snapshot(sec)))
    const secErrors = $derived(
        secAttempted && !secValidation.success ? buildErrors(secValidation.error.issues) : {}
    )

    const submitSec = () => {
        secAttempted = true
        secError = ''
        secSaved = false
        if (!secValidation.success) return
        const data = secValidation.data
        $changePassword.mutate(data, {
            onSuccess: () => {
                secSaved = true
                secAttempted = false
                sec = securityDefaults()
            },
            onError: (e) =>
                (secError = getErrorMessage(e) ?? 'No se pudo cambiar la contraseña.')
        })
    }
</script>

<SectionHeader title="Mi cuenta" subtitle="Tu información de acceso" {onBack} />

<div class="flex flex-col gap-5 px-5 pb-8">
    {#if $profileQuery.isLoading}
        <ScreenState kind="loading" />
    {:else if $profileQuery.isError || !user}
        <ScreenState kind="error" message="No se pudo cargar tu cuenta." />
    {:else}
        <!-- Tarjeta de perfil -->
        <div class="overflow-hidden rounded-2xl border border-border bg-card">
            <div
                class="flex items-center gap-4 px-5 py-5"
                style="background:linear-gradient(135deg, hsla(217,91%,50%,0.08), hsla(213,94%,58%,0.04))"
            >
                <span
                    class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
                    style="background:linear-gradient(135deg,hsl(213,94%,60%),hsl(217,91%,50%));box-shadow:0 8px 16px hsla(217,91%,50%,0.35)"
                >
                    {initials}
                </span>
                <div class="min-w-0">
                    <p class="truncate text-base font-bold text-foreground">
                        {user.name} {user.lastname}
                    </p>
                    <p class="truncate text-xs text-muted-foreground">{user.email}</p>
                    <span
                        class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary"
                        style="background-color:hsla(217,91%,50%,0.12)"
                    >
                        <ShieldCheck size={11} strokeWidth={2.4} />
                        {ROLE_LABEL[user.type] ?? user.type}
                    </span>
                </div>
            </div>
        </div>

        <!-- Información personal -->
        <section class="rounded-2xl border border-border bg-card p-5">
            <div class="mb-4 flex items-center gap-2.5">
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                    style="background-color:hsla(217,91%,50%,0.12)"
                >
                    <UserRound size={16} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </span>
                <div>
                    <h2 class="text-sm font-bold text-foreground">Información personal</h2>
                    <p class="text-[11px] text-muted-foreground">
                        Actualiza tu nombre y correo de acceso
                    </p>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <FormField
                    bind:value={info.name}
                    label="Nombre *"
                    placeholder="Ej: Juan"
                    error={infoErrors['name']}
                    maxlength={100}
                    oninput={() => ((infoError = ''), (infoSaved = false))}
                />
                <FormField
                    bind:value={info.lastname}
                    label="Apellido *"
                    placeholder="Ej: Pérez"
                    error={infoErrors['lastname']}
                    maxlength={100}
                    oninput={() => ((infoError = ''), (infoSaved = false))}
                />
                <div>
                    <FormField
                        bind:value={info.email}
                        label="Correo electrónico *"
                        placeholder="Ej: juan@minegocio.com"
                        error={infoErrors['email']}
                        inputmode="text"
                        autocapitalize="none"
                        maxlength={255}
                        oninput={() => ((infoError = ''), (infoSaved = false))}
                    />
                    <p class="mt-1.5 ml-0.5 text-[11px] text-muted-foreground">
                        Lo usas para iniciar sesión. Debe ser único.
                    </p>
                </div>

                {#if infoError}
                    <StatusBanner kind="error" message={infoError} />
                {:else if infoSaved}
                    <StatusBanner kind="success" message="Perfil actualizado" />
                {/if}

                <PrimaryButton
                    label="Guardar cambios"
                    icon={Save}
                    loading={$updateMe.isPending}
                    disabled={!infoDirty}
                    onclick={submitInfo}
                />
            </div>
        </section>

        <!-- Seguridad -->
        <section class="rounded-2xl border border-border bg-card p-5">
            <div class="mb-4 flex items-center gap-2.5">
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                    style="background-color:hsla(32,95%,44%,0.12)"
                >
                    <ShieldCheck size={16} color="hsl(32, 95%, 44%)" strokeWidth={2} />
                </span>
                <div>
                    <h2 class="text-sm font-bold text-foreground">Seguridad</h2>
                    <p class="text-[11px] text-muted-foreground">Cambia tu contraseña de acceso</p>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <FormField
                    bind:value={sec.current_password}
                    label="Contraseña actual *"
                    placeholder="Tu contraseña actual"
                    error={secErrors['current_password']}
                    secure
                    autocomplete="current-password"
                    oninput={() => ((secError = ''), (secSaved = false))}
                />
                <FormField
                    bind:value={sec.new_password}
                    label="Nueva contraseña *"
                    placeholder="Mínimo 8 caracteres"
                    error={secErrors['new_password']}
                    secure
                    autocomplete="new-password"
                    oninput={() => ((secError = ''), (secSaved = false))}
                />
                <FormField
                    bind:value={sec.confirm_password}
                    label="Confirmar contraseña *"
                    placeholder="Repite la nueva contraseña"
                    error={secErrors['confirm_password']}
                    secure
                    autocomplete="new-password"
                    oninput={() => ((secError = ''), (secSaved = false))}
                />

                {#if secError}
                    <StatusBanner kind="error" message={secError} />
                {:else if secSaved}
                    <StatusBanner kind="success" message="Contraseña actualizada" />
                {/if}

                <PrimaryButton
                    label="Cambiar contraseña"
                    icon={KeyRound}
                    loading={$changePassword.isPending}
                    onclick={submitSec}
                />
            </div>
        </section>
    {/if}
</div>
