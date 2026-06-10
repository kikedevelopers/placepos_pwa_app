<script lang="ts">
    import { Building2, Settings } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { auth } from '$lib/stores/auth.svelte'
    import SettingsSheet from '$lib/components/SettingsSheet.svelte'
    import BranchSwitcher from '$lib/components/BranchSwitcher.svelte'

    const ROLE_LABELS: Record<string, string> = {
        superadmin: 'Administrador',
        owner: 'Propietario',
        manager: 'Gerente',
        employee: 'Empleado'
    }

    const greeting = (): string => {
        const h = new Date().getHours()
        if (h < 12) return 'Buenos días'
        if (h < 19) return 'Buenas tardes'
        return 'Buenas noches'
    }

    const initialsOf = (name: string): string => {
        const parts = name.trim().split(/\s+/).filter(Boolean)
        const initials = parts
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? '')
            .join('')
        return initials || 'U'
    }

    let menuOpen = $state(false)
    const profileQuery = useProfile()

    const profile = $derived($profileQuery.data?.payload?.user_profile)
    const storeUser = $derived(auth.user)
    const name = $derived(
        [profile?.name ?? storeUser?.name, profile?.lastname ?? storeUser?.lastname]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Usuario'
    )
    const company = $derived($profileQuery.data?.payload?.company_profile?.primary?.name ?? '')
    const type = $derived(profile?.type ?? storeUser?.type ?? '')
    const branchesEnabled = $derived(profile?.branches_enabled ?? false)
</script>

<header
    class="border-b border-border/70 bg-card pt-[env(safe-area-inset-top)]"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div class="flex items-center gap-3 px-5 pt-2.5 pb-3">
        <div
            class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
            style="background:linear-gradient(135deg,hsl(213,94%,60%),hsl(221,83%,45%));box-shadow:0 5px 10px hsla(217,91%,50%,0.3)"
        >
            {initialsOf(name)}
        </div>

        <div class="min-w-0 flex-1">
            <p class="text-xs text-muted-foreground">{greeting()},</p>
            <p class="truncate text-base font-bold tracking-tight text-foreground">{name}</p>
            <div class="mt-0.5 flex items-center gap-1.5">
                {#if (type === 'owner' || type === 'superadmin') && branchesEnabled}
                    <BranchSwitcher />
                {:else if company}
                    <Building2 size={11} color="hsl(215, 16%, 47%)" strokeWidth={2} />
                    <span class="truncate text-[11px] text-muted-foreground">{company}</span>
                {/if}
                <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary"
                    style="background-color: hsla(217, 91%, 50%, 0.12)"
                >
                    {ROLE_LABELS[type] ?? 'Usuario'}
                </span>
            </div>
        </div>

        <button
            type="button"
            aria-label="Ajustes"
            onclick={() => (menuOpen = true)}
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary transition-transform active:scale-[0.97]"
        >
            <Settings size={18} color="hsl(215, 16%, 47%)" strokeWidth={2} />
        </button>
    </div>

    <SettingsSheet open={menuOpen} onClose={() => (menuOpen = false)} />
</header>
