<script lang="ts">
    import { Building2, Settings } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { auth } from '$lib/stores/auth.svelte'
    import SettingsSheet from '$lib/components/SettingsSheet.svelte'
    import BranchSwitcher from '$lib/components/BranchSwitcher.svelte'
    import { HEADER_BACKGROUND_STYLE } from '$lib/theme/statusBar'
    import { greetingFor, initialsOf, roleLabel } from './appHeader'

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

<!--
    Header en el azul de la marca, continuo con la barra de estado del móvil:
    - `sticky top-0` + `background-color` sólido = el color que iOS 26 toma
      para pintar la franja del reloj (ver HEADER_BACKGROUND_STYLE).
    - En iOS ≤18 y ≥26.5 se dibuja detrás del reloj (black-translucent) y el
      padding del área segura baja el contenido.
    El contenido (<main>) sube sobre él como una hoja clara redondeada; por eso
    el padding inferior extra.
-->
<header
    class="sticky top-0 pt-[var(--app-safe-top)] text-white"
    style={HEADER_BACKGROUND_STYLE}
>
    <!-- Brillo suave a la derecha, LEJOS del borde superior: la franja del
         reloj debe quedar de un solo tono para fundirse sin costura. -->
    <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden"
        style="background:radial-gradient(90% 80% at 100% 70%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 60%)"
    ></div>

    <div class="relative flex items-center gap-3.5 px-5 pt-3 pb-9">
        <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tracking-wide text-white ring-1 ring-white/30"
            style="background:rgba(255,255,255,0.18);box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 6px 14px rgba(9,30,90,0.18)"
        >
            {initialsOf(name)}
        </div>

        <div class="min-w-0 flex-1">
            <p class="text-[12.5px] text-white/75">{greetingFor(new Date().getHours())},</p>
            <p class="truncate text-[19px] font-semibold leading-tight tracking-[-0.02em]">{name}</p>
            <div class="mt-1 flex min-w-0 items-center gap-2">
                {#if (type === 'owner' || type === 'superadmin') && branchesEnabled}
                    <BranchSwitcher tone="onBrand" />
                {:else if company}
                    <span class="flex min-w-0 items-center gap-1">
                        <Building2 size={12} color="rgba(255,255,255,0.78)" strokeWidth={2} />
                        <span class="truncate text-[12px] font-medium text-white/85">{company}</span>
                    </span>
                {/if}
                <span
                    class="shrink-0 rounded-full px-2 py-[3px] text-[10.5px] font-semibold tracking-wide text-white"
                    style="background:rgba(255,255,255,0.18)"
                >
                    {roleLabel(type)}
                </span>
            </div>
        </div>

        <button
            type="button"
            aria-label="Ajustes"
            onclick={() => (menuOpen = true)}
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-white/25 transition-[transform,background-color] duration-100 ease-out active:scale-[0.94] active:bg-white/25"
            style="background:rgba(255,255,255,0.14);box-shadow:inset 0 1px 0 rgba(255,255,255,0.25)"
        >
            <Settings size={19} color="white" strokeWidth={2} />
        </button>
    </div>

</header>

<!--
    El menú va FUERA del <header>: el header es `sticky`, y un elemento sticky
    crea su propio contexto de apilamiento. Dentro de él, el sheet (fixed z-50)
    quedaba atrapado y la hoja de contenido (<main>) se pintaba encima: el menú
    "no abría".
-->
<SettingsSheet open={menuOpen} onClose={() => (menuOpen = false)} />
