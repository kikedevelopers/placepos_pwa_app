<script lang="ts">
    import { goto } from '$app/navigation'
    import { ChevronRight, LogOut, Moon, Settings, Sun } from '@lucide/svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import { Segmented } from '$lib/components/premium'
    import { useLogout } from '$lib/hooks/useLogout'
    import { useProfile } from '$lib/hooks/useProfile'
    import { auth } from '$lib/stores/auth.svelte'
    import { theme, type ThemeMode } from '$lib/stores/theme.svelte'
    import { initialsOf, roleLabel } from './appHeader'

    /**
     * Menú de cuenta (botón de ajustes del header): tarjeta de perfil, tema,
     * acceso a Configuraciones y, aparte y en rojo, Cerrar sesión. Se monta con
     * BottomSheet (portal a <body>): nada del header puede taparlo.
     */
    interface Props {
        open: boolean
        onClose: () => void
    }
    let { open, onClose }: Props = $props()

    const logout = useLogout()
    const profileQuery = useProfile()
    const profile = $derived($profileQuery.data?.payload?.user_profile)
    const name = $derived(
        [profile?.name ?? auth.user?.name, profile?.lastname ?? auth.user?.lastname].filter(Boolean).join(' ').trim() ||
            'Usuario'
    )
    const company = $derived($profileQuery.data?.payload?.company_profile?.primary?.name ?? '')
    const role = $derived(roleLabel(profile?.type ?? auth.user?.type ?? ''))

    const goToSettings = () => {
        onClose()
        goto('/configuracion')
    }
    const handleLogout = () => {
        onClose()
        logout()
    }
</script>

<BottomSheet {open} {onClose}>
    <div class="flex flex-col gap-5 pb-1">
        <!-- Perfil -->
        <div class="flex items-center gap-3.5 px-1">
            <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-white"
                style="background:linear-gradient(150deg,hsl(213,94%,58%),hsl(221,83%,45%));box-shadow:inset 0 1px 0 rgba(255,255,255,0.3),0 8px 18px -8px hsl(217 91% 45% / 0.7)"
            >
                {initialsOf(name)}
            </span>
            <span class="min-w-0 flex-1">
                <span class="block truncate text-[19px] font-semibold tracking-[-0.02em] text-foreground">{name}</span>
                <span class="mt-0.5 block truncate text-[13px] text-muted-foreground">
                    {[company, role].filter(Boolean).join(' · ')}
                </span>
            </span>
        </div>

        <!-- Preferencias -->
        <div class="surface group-rows overflow-hidden">
            <div class="row flex items-center gap-3 px-4 py-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                    {#if theme.mode === 'dark'}<Moon size={16} strokeWidth={2.1} />{:else}<Sun size={16} strokeWidth={2.1} />{/if}
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block text-[15px] text-foreground">Tema</span>
                    <span class="block text-[12px] text-muted-foreground">Modo oscuro próximamente</span>
                </span>
                <Segmented
                    class="w-[148px]"
                    ariaLabel="Tema de la aplicación"
                    options={[
                        { value: 'light', label: 'Claro' },
                        { value: 'dark', label: 'Oscuro' }
                    ]}
                    value={theme.mode as ThemeMode}
                    onChange={(m) => theme.setMode(m as ThemeMode)}
                />
            </div>
            <button
                type="button"
                onclick={goToSettings}
                class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05]"
            >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-foreground/[0.07] text-foreground/70">
                    <Settings size={16} strokeWidth={2.1} />
                </span>
                <span class="min-w-0 flex-1 text-[15px] text-foreground">Configuraciones</span>
                <ChevronRight size={16} class="shrink-0 text-muted-foreground/50" />
            </button>
        </div>

        <!-- Acción destructiva aparte, como en iOS -->
        <button
            type="button"
            onclick={handleLogout}
            class="surface flex h-[52px] w-full items-center justify-center gap-2 text-[15.5px] font-semibold text-destructive transition-transform duration-150 ease-out active:scale-[0.98]"
        >
            <LogOut size={17} strokeWidth={2.2} />
            Cerrar sesión
        </button>
    </div>
</BottomSheet>
