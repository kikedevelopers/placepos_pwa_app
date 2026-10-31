<script lang="ts">
    import { fromStore } from 'svelte/store'
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { toast } from 'svelte-sonner'
    import { auth } from '$lib/stores/auth.svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { notificationsCenter } from '$lib/stores/notificationsCenter.svelte'
    import { pushStore } from '$lib/push/pushStore.svelte'
    import { subscribeRealtime } from '$lib/realtime/bus'
    import { AGENT_ORDERS_EVENT } from '$lib/modules/AgentOrders/constants'
    import { useAgentOrdersAccess } from '$lib/modules/AgentOrders/hooks/useAgentOrdersAccess.svelte'
    import {
        agentOrderEventOf,
        agentSystemNotification,
        createEventDeduper,
        isOtherBranchEvent,
        OPEN_NOTIFICATIONS_ROUTE,
        otherBranchSystemNotification
    } from '$lib/modules/AgentOrders/utils/agentEvents'
    import NotificationsSheet from './NotificationsSheet.svelte'

    /**
     * Todo lo global de los avisos, montado una vez en el shell de la app:
     *   - El panel de la campana, que se abre también con `?notifications=open`.
     *   - El toque de una notificación push (el service worker manda la ruta).
     *   - El aviso dentro de la app cuando llega o cambia un pedido del agente.
     *   - Mantener al día la suscripción push (sesión y negocio actuales).
     */
    const access = useAgentOrdersAccess()
    const profile = fromStore(useProfile())
    const companyId = $derived(profile.current.data?.payload?.company_profile?.primary?.id ?? null)
    const dedupe = createEventDeduper()

    const navigate = (url: string) => {
        if (url === OPEN_NOTIFICATIONS_ROUTE) {
            notificationsCenter.open()
            return
        }
        void goto(url)
    }

    // `?notifications=open` (toque de un push de otra sucursal): abre el panel y
    // limpia la URL para que volver atrás no lo reabra.
    $effect(() => {
        if (page.url.searchParams.get('notifications') !== 'open') return
        notificationsCenter.open()
        const url = new URL(page.url)
        url.searchParams.delete('notifications')
        void goto(url, { replaceState: true, noScroll: true, keepFocus: true })
    })

    // Toque de una notificación push con la app ya abierta.
    $effect(() => {
        if (!('serviceWorker' in navigator)) return
        const onMessage = (event: MessageEvent) => {
            const data = event.data as { type?: unknown; url?: unknown } | null
            if (data?.type !== 'placepos:navigate' || typeof data.url !== 'string') return
            const target = new URL(data.url, location.origin)
            if (target.origin !== location.origin) return
            navigate(`${target.pathname}${target.search}`)
        }
        navigator.serviceWorker.addEventListener('message', onMessage)
        return () => navigator.serviceWorker.removeEventListener('message', onMessage)
    })

    // Suscripción push al día: al iniciar sesión y al cambiar de negocio.
    $effect(() => {
        const token = auth.token
        void companyId
        if (token) void pushStore.sync()
    })

    // Aviso dentro de la app por cada evento del cliente con su pedido.
    $effect(() =>
        subscribeRealtime(AGENT_ORDERS_EVENT, (payload) => {
            const event = agentOrderEventOf(payload)
            // Un evento puede llegar dos veces (room del negocio y room del dueño).
            if (event === null || !dedupe(event)) return
            if (isOtherBranchEvent(event, companyId)) {
                const notice = otherBranchSystemNotification(event)
                toast(notice.title, {
                    description: notice.body,
                    action: { label: 'Ver', onClick: () => notificationsCenter.open() }
                })
                return
            }
            if (!access.enabled) return
            // Ya se está mirando la bandeja: el pedido aparece resaltado ahí.
            if (page.url.pathname === '/reportes' && page.url.searchParams.get('tab') === 'agente') return
            const notice = agentSystemNotification(
                event,
                typeof event.total === 'number'
                    ? {
                          customer_name: event.customer_name ?? null,
                          chat_display_name: null,
                          total: event.total,
                          items_count: event.items_count ?? 0
                      }
                    : null
            )
            toast(notice.title, {
                description: notice.body,
                action: { label: 'Ver pedido', onClick: () => navigate(notice.route) }
            })
        })
    )
</script>

<NotificationsSheet />
