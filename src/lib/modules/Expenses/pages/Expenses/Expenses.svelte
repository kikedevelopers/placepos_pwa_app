<script lang="ts">
    import { Receipt, CalendarClock } from '@lucide/svelte'
    import { page } from '$app/state'
    import { goto } from '$app/navigation'
    import { browser } from '$app/environment'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import {
        DEFAULT_EXPENSES_TAB,
        EXPENSES_TAB_FIXED,
        EXPENSES_TAB_QUERY_PARAM,
        EXPENSES_TAB_VARIABLE,
        isExpensesTab,
        type ExpensesTab
    } from './constants/tabs'
    import VariableExpenses from './components/variable/VariableExpenses.svelte'
    import FixedExpenses from './components/fixed/FixedExpenses.svelte'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'

    // Gating RBAC: la sección de gastos FIJOS sólo se muestra con
    // `canAccessFixedExpenses` (owner ve todo). Sin permiso, sólo variables.
    const permissions = usePermissions()
    const canFixed = $derived(permissions.canAccessFixedExpenses)

    // Estado del tab sincronizado con el query param ?tab= (copia fiel de placepos
    // desktop, adaptada al router rune-based de SvelteKit). La URL es la fuente de
    // verdad: así el tab sobrevive a recargas, deep-links y back/forward.
    const rawTab = $derived<ExpensesTab>(
        isExpensesTab(page.url.searchParams.get(EXPENSES_TAB_QUERY_PARAM))
            ? (page.url.searchParams.get(EXPENSES_TAB_QUERY_PARAM) as ExpensesTab)
            : DEFAULT_EXPENSES_TAB
    )
    // Si el deep-link pide fijos pero no hay permiso, se cae a variables.
    const activeTab = $derived<ExpensesTab>(
        rawTab === EXPENSES_TAB_FIXED && !canFixed ? EXPENSES_TAB_VARIABLE : rawTab
    )

    const TABS = $derived<{ id: ExpensesTab; label: string; icon: typeof Receipt }[]>(
        [
            { id: EXPENSES_TAB_VARIABLE, label: 'Variables', icon: Receipt },
            ...(canFixed
                ? [{ id: EXPENSES_TAB_FIXED, label: 'Fijos', icon: CalendarClock }]
                : [])
        ]
    )

    const selectTab = (next: ExpensesTab) => {
        if (next === activeTab || !browser) return
        const url = new URL(page.url)
        url.searchParams.set(EXPENSES_TAB_QUERY_PARAM, next)
        goto(url, { replaceState: true, keepFocus: true, noScroll: true })
    }
</script>

<div class="flex flex-1 flex-col">
    <!-- Header premium: título + subtítulo sobre fondo con halo radial sutil -->
    <header class="relative overflow-hidden px-5 pb-4 pt-5">
        <div
            class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-60 blur-2xl"
            style="background: radial-gradient(circle, hsla(0,84%,60%,0.16), transparent 70%)"
            aria-hidden="true"
        ></div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Gastos</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">
            Controla los egresos del negocio en un único lugar
        </p>
    </header>

    <!-- Segmented control móvil (thumb deslizante, iconos), no tabs de escritorio.
         Sólo se muestra si hay más de una sección disponible (RBAC). -->
    {#if TABS.length > 1}
    <div class="px-5 pb-2">
        <div
            class="flex rounded-2xl bg-secondary p-1 shadow-[inset_0_1px_2px_hsla(222,47%,11%,0.04)]"
            role="tablist"
            aria-label="Tipo de gasto"
        >
            {#each TABS as t (t.id)}
                {@const active = t.id === activeTab}
                <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onclick={() => selectTab(t.id)}
                    class="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] {active
                        ? 'bg-card text-foreground'
                        : 'text-muted-foreground'}"
                    style={active ? 'box-shadow:0 2px 8px hsla(222,47%,11%,0.10)' : ''}
                >
                    <t.icon size={17} strokeWidth={2.4} />
                    <span class="tabular-nums">{t.label}</span>
                </button>
            {/each}
        </div>
    </div>
    {/if}

    {#key activeTab}
        <FadeInUp index={0} class="flex flex-1 flex-col">
            {#if activeTab === EXPENSES_TAB_FIXED && canFixed}
                <FixedExpenses />
            {:else}
                <VariableExpenses />
            {/if}
        </FadeInUp>
    {/key}
</div>
