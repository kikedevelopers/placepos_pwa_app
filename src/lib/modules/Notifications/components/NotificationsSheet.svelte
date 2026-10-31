<script lang="ts">
    import { fromStore } from 'svelte/store'
    import { goto } from '$app/navigation'
    import { BellOff, CheckCheck, Inbox, LoaderCircle, X } from '@lucide/svelte'
    import AdaptiveSheet from '$lib/components/AdaptiveSheet.svelte'
    import { EmptyState, Segmented, SkeletonList } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { useProfile } from '$lib/hooks/useProfile'
    import { notificationsCenter } from '$lib/stores/notificationsCenter.svelte'
    import type { AppAlert } from '$lib/api/requests/appAlerts/types'
    import NotificationRow from './NotificationRow.svelte'
    import PushCard from './PushCard.svelte'
    import {
        useNotificationMutations,
        useNotificationsList,
        useUnreadNotificationsCount
    } from '../hooks/useNotifications.svelte'
    import {
        CATEGORY_LABEL,
        categoryOf,
        countByCategory,
        groupByDay,
        isInHistory,
        otherBranchOf,
        READ_RETENTION_DAYS,
        targetOf,
        type NotificationCategory
    } from '../utils/notifications'

    /**
     * Centro de notificaciones (espejo del panel de placepos): "Sin leer /
     * Todas", filtro por tipo, lista por día y acceso directo a cada aviso (el
     * pedido del agente, el gasto fijo…). Arriba, la tarjeta para activar los
     * avisos push en este dispositivo.
     */
    type View = 'unread' | 'all'
    type CategoryFilter = NotificationCategory | 'any'
    const CATEGORY_ORDER: NotificationCategory[] = ['orders', 'expenses', 'customers', 'other']

    let view = $state<View>('unread')
    let category = $state<CategoryFilter>('any')

    const isOpen = () => notificationsCenter.isOpen
    const unreadQuery = useNotificationsList(true, isOpen)
    const allQuery = useNotificationsList(false, () => isOpen() && view === 'all')
    const unread = useUnreadNotificationsCount()
    const mutations = useNotificationMutations()
    const profile = fromStore(useProfile())

    const currentCompanyId = $derived(profile.current.data?.payload?.company_profile?.primary?.id ?? null)
    const unreadAlerts = $derived((unreadQuery.current.data?.alerts ?? []).filter((a) => !a.is_read))
    const allAlerts = $derived((allQuery.current.data?.alerts ?? []).filter((a) => isInHistory(a)))
    const unreadCount = $derived(unreadQuery.current.data ? unreadAlerts.length : unread.count)
    const source = $derived(view === 'unread' ? unreadAlerts : allAlerts)
    const counts = $derived(countByCategory(source))
    const visible = $derived(category === 'any' ? source : source.filter((a) => categoryOf(a) === category))
    const groups = $derived(groupByDay(visible))
    const isLoading = $derived(view === 'unread' ? unreadQuery.current.isLoading : allQuery.current.isLoading)
    const isError = $derived(view === 'unread' ? unreadQuery.current.isError : allQuery.current.isError)
    const presentCategories = $derived(CATEGORY_ORDER.filter((key) => counts[key] > 0))

    const openAlert = (alert: AppAlert) => {
        const target = targetOf(alert, currentCompanyId)
        if (!target) return
        if (!alert.is_read) mutations.markRead(alert.id)
        notificationsCenter.close()
        void goto(target)
    }

    const setView = (next: View) => {
        view = next
        category = 'any'
    }
</script>

<AdaptiveSheet open={notificationsCenter.isOpen} onClose={() => notificationsCenter.close()} ariaLabel="Notificaciones">
    <header class="flex items-start gap-3 px-5 pb-3 pt-3">
        <div class="min-w-0 flex-1">
            <h2 class="text-[21px] font-semibold tracking-[-0.025em] text-foreground">Notificaciones</h2>
            <p class="mt-0.5 text-[13px] text-muted-foreground" aria-live="polite">
                {#if unreadCount > 0}
                    <span class="font-semibold tabular-nums text-foreground">{unreadCount}</span> sin leer
                {:else}
                    Todo leído
                {/if}
            </p>
        </div>
        <button
            type="button"
            onclick={() => mutations.markAllRead()}
            disabled={unreadCount === 0 || mutations.isMarkingAll}
            class="mt-0.5 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-primary transition-[background-color,transform,opacity] duration-150 ease-out active:scale-[0.96] active:bg-primary/10 disabled:opacity-35"
        >
            {#if mutations.isMarkingAll}
                <LoaderCircle size={15} class="animate-spin" />
            {:else}
                <CheckCheck size={16} strokeWidth={2.2} />
            {/if}
            Leer todo
        </button>
        <button
            type="button"
            aria-label="Cerrar"
            onclick={() => notificationsCenter.close()}
            class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-[transform,background-color] duration-150 ease-out active:scale-[0.92]"
        >
            <X size={17} strokeWidth={2.2} />
        </button>
    </header>

    <div class="space-y-3 px-5 pb-3">
        <PushCard />
        <Segmented
            ariaLabel="Qué notificaciones ver"
            options={[
                { value: 'unread', label: unreadCount > 0 ? `Sin leer · ${unreadCount}` : 'Sin leer' },
                { value: 'all', label: 'Todas' }
            ]}
            value={view}
            onChange={setView}
        />
        {#if presentCategories.length > 1}
            <div role="group" aria-label="Filtrar por tipo" class="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none]">
                {#each ['any', ...presentCategories] as key (key)}
                    {@const active = category === key}
                    <button
                        type="button"
                        aria-pressed={active}
                        onclick={() => (category = key as CategoryFilter)}
                        class={cn(
                            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]',
                            active
                                ? 'bg-foreground text-background'
                                : 'bg-card text-muted-foreground shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]'
                        )}
                    >
                        {key === 'any' ? 'Todo' : CATEGORY_LABEL[key as NotificationCategory]}
                        <span class={cn('tabular-nums', active ? 'text-background/65' : 'text-muted-foreground/70')}>
                            {key === 'any' ? source.length : counts[key as NotificationCategory]}
                        </span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-foreground/[0.06] pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {#if isLoading}
            <div class="px-5 pt-4"><SkeletonList rows={5} /></div>
        {:else if isError}
            <EmptyState
                kind="error"
                title="No se pudieron cargar"
                message="Revisa tu conexión; se actualizan solas al volver."
            />
        {:else if groups.length === 0}
            <EmptyState
                icon={view === 'unread' && category === 'any' ? Inbox : BellOff}
                title={view === 'unread' && category === 'any' ? 'Estás al día' : 'Nada por aquí'}
                message={view === 'unread' && category === 'any'
                    ? 'Cuando llegue un pedido del agente o venza un gasto, te avisamos aquí al instante.'
                    : 'No hay notificaciones con este filtro.'}
            />
        {:else}
            {#each groups as group (group.label)}
                <section aria-label={group.label} class="pb-1">
                    <h3 class="sticky top-0 z-[2] bg-card/95 px-5 pb-1.5 pt-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground backdrop-blur-sm">
                        {group.label}
                    </h3>
                    <ul class="space-y-0.5 px-2">
                        {#each group.alerts as alert (alert.id)}
                            <NotificationRow
                                {alert}
                                hasTarget={targetOf(alert, currentCompanyId) !== null}
                                branchName={otherBranchOf(alert, currentCompanyId)}
                                isMarking={mutations.markingId === alert.id}
                                onOpen={openAlert}
                                onMarkRead={(id) => mutations.markRead(id)}
                            />
                        {/each}
                    </ul>
                </section>
            {/each}
            {#if view === 'all'}
                <p class="px-5 pb-2 pt-3 text-center text-[12px] text-muted-foreground">
                    Las notificaciones leídas se guardan {READ_RETENTION_DAYS} días.
                </p>
            {/if}
        {/if}
    </div>
</AdaptiveSheet>
