<script lang="ts">
    import { canRetryReply } from '$lib/modules/Place/lib/retry'
    import { onDestroy, tick } from 'svelte'
    import { toStore } from 'svelte/store'
    import { goto } from '$app/navigation'
    import { createQuery } from '@tanstack/svelte-query'
    import { Hourglass, Loader2 } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { usePlaceStatus, shouldBlockPlaceRoute } from '$lib/modules/Place/availability'
    import { getAiGreeting } from '$lib/api/requests/ai'
    import { placeChat } from '$lib/modules/Place/store/chat.svelte'
    import ChatHeader from '$lib/modules/Place/components/ChatHeader.svelte'
    import EmptyState from '$lib/modules/Place/components/EmptyState.svelte'
    import MessageBubble from '$lib/modules/Place/components/MessageBubble.svelte'
    import Composer from '$lib/modules/Place/components/Composer.svelte'
    import {
        CREDITS_EXHAUSTED_MESSAGE,
        describeRemaining,
        isOutOfCredits,
        latestCredits
    } from '$lib/modules/Place/lib/credits'

    const profileQuery = useProfile()
    const statusQuery = usePlaceStatus()

    const userName = $derived(
        ($profileQuery.data?.payload?.user_profile?.name ?? '').trim().split(/\s+/)[0] || 'Bienvenido'
    )
    const businessName = $derived(
        $profileQuery.data?.payload?.company_profile?.primary?.name || 'tu negocio'
    )
    const assistantName = $derived($statusQuery.data?.assistantName?.trim() || 'Place')
    const model = $derived($statusQuery.data?.models?.[0] ?? $statusQuery.data?.defaultModel ?? null)
    const enabled = $derived($statusQuery.data?.enabled)
    const statusLoading = $derived($statusQuery.isLoading)

    // Créditos del día: gana la lectura más reciente (al abrir o al enviar).
    const credits = $derived(
        latestCredits(
            $statusQuery.data?.credits
                ? { credits: $statusQuery.data.credits, at: $statusQuery.dataUpdatedAt }
                : null,
            placeChat.credits
        )
    )
    const outOfCredits = $derived(isOutOfCredits(credits))

    // Sin consultas: se vuelve a preguntar cada 5 min para desbloquear solo
    // cuando cambie el día o el administrador asigne más.
    $effect(() => {
        if (!outOfCredits) return
        const id = setInterval(() => void $statusQuery.refetch(), 5 * 60 * 1000)
        return () => clearInterval(id)
    })

    // Gate de navegación: si Place está apagado para la cuenta, fuera de la ruta.
    $effect(() => {
        if (shouldBlockPlaceRoute({ isLoading: statusLoading, enabled })) {
            void goto('/')
        }
    })

    // Hidratar la conversación persistida una sola vez.
    placeChat.hydrate()

    const messages = $derived(placeChat.messages)
    const isChatEmpty = $derived(messages.length === 0)

    // Saludo del asistente: solo con el chat vacío y Place disponible.
    const greetingQuery = createQuery(
        toStore(() => ({
            queryKey: ['ai-greeting'],
            queryFn: getAiGreeting,
            enabled: enabled === true && isChatEmpty,
            staleTime: 5 * 60 * 1000,
            retry: 0
        }))
    )
    const greeting = $derived(
        $greetingQuery.data?.text ??
            `Soy ${assistantName}, el asistente de ${businessName}. Conozco tus ventas, caja, inventario, cartera y gastos. Pregúntame lo que necesites.`
    )

    let seed = $state<{ value: string; token: number } | null>(null)

    let scroller: HTMLDivElement | null = $state(null)
    const lastContent = $derived(messages[messages.length - 1]?.content ?? '')
    $effect(() => {
        void messages.length
        void lastContent
        tick().then(() => {
            if (scroller) scroller.scrollTop = scroller.scrollHeight
        })
    })

    const lastAssistantId = $derived(
        [...messages].reverse().find((m) => m.role === 'assistant')?.id
    )

    // Al salir del chat se corta cualquier generación en curso.
    onDestroy(() => placeChat.stop())
</script>

<div class="relative flex h-[var(--app-height)] flex-col overflow-hidden bg-background">
    <!-- Luz de ambiente superior. -->
    <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 h-56"
        style="background:radial-gradient(60%_100%_at_50%_0%,rgba(30,125,240,0.1),transparent_72%)"
    ></div>

    {#if statusLoading}
        <div class="flex h-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 class="animate-spin" size={18} />
            <span class="text-[13px]">Conectando con {assistantName}…</span>
        </div>
    {:else if enabled === true}
        <ChatHeader
            {assistantName}
            {businessName}
            {model}
            isStreaming={placeChat.isStreaming}
            canReset={!isChatEmpty}
            onback={() => goto('/')}
            onnew={() => {
                placeChat.reset()
                seed = null
            }}
        />

        <div bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto">
            {#if isChatEmpty}
                <EmptyState
                    {userName}
                    {businessName}
                    {greeting}
                    loadingGreeting={$greetingQuery.isLoading}
                    onpick={(prompt) => (seed = { value: prompt, token: Date.now() })}
                />
            {:else}
                <div class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3.5 py-4">
                    {#each messages as message (message.id)}
                        <MessageBubble
                            {message}
                            canRetry={canRetryReply(message, {
                                isStreaming: placeChat.isStreaming,
                                lastAssistantId
                            })}
                            onretry={() => placeChat.retryLast()}
                        />
                    {/each}
                </div>
            {/if}
        </div>

        {#if outOfCredits}
            <div class="px-4">
                <div
                    role="status"
                    class="mb-2 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 px-3.5 py-3 text-[12.5px] leading-snug text-amber-800"
                    style="background:rgba(245,158,11,0.07)"
                >
                    <Hourglass size={15} class="mt-px shrink-0" />
                    <span>{CREDITS_EXHAUSTED_MESSAGE}</span>
                </div>
            </div>
        {/if}

        <Composer
            {assistantName}
            disabled={outOfCredits}
            disabledPlaceholder={outOfCredits ? 'Sin consultas disponibles por hoy' : undefined}
            hint={describeRemaining(credits)}
            isStreaming={placeChat.isStreaming}
            {seed}
            onsend={(text) => placeChat.send(text)}
            onstop={() => placeChat.stop()}
        />
    {/if}
</div>
