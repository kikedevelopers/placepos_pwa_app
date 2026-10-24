<script lang="ts">
    import { page } from '$app/state'
    import { goto } from '$app/navigation'
    import { browser } from '$app/environment'
    import { Segmented } from '$lib/components/premium'
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

    const TABS = $derived<{ id: ExpensesTab; label: string }[]>([
        { id: EXPENSES_TAB_VARIABLE, label: 'Variables' },
        ...(canFixed ? [{ id: EXPENSES_TAB_FIXED, label: 'Fijos' }] : [])
    ])

    const selectTab = (next: ExpensesTab) => {
        if (next === activeTab || !browser) return
        const url = new URL(page.url)
        url.searchParams.set(EXPENSES_TAB_QUERY_PARAM, next)
        goto(url, { replaceState: true, keepFocus: true, noScroll: true })
    }
</script>

<div class="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
    <h1 class="text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground">Gastos</h1>

    <!-- Variables / Fijos solo si el rol ve las dos secciones. -->
    {#if TABS.length > 1}
        <Segmented
            ariaLabel="Tipo de gasto"
            options={TABS.map((t) => ({ value: t.id, label: t.label }))}
            value={activeTab}
            onChange={(v) => selectTab(v)}
        />
    {/if}

    {#key activeTab}
        <div class="flex flex-1 flex-col motion-safe:animate-fade-in-up">
            {#if activeTab === EXPENSES_TAB_FIXED && canFixed}
                <FixedExpenses />
            {:else}
                <VariableExpenses />
            {/if}
        </div>
    {/key}
</div>
