<script lang="ts">
    import { Segmented, SkeletonList } from '$lib/components/premium'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import AgentBehaviorForm from '$lib/modules/SalesAgent/components/AgentBehaviorForm.svelte'
    import TelegramChannelCard from '$lib/modules/SalesAgent/components/TelegramChannelCard.svelte'
    import WhatsappChannelCard from '$lib/modules/SalesAgent/components/WhatsappChannelCard.svelte'
    import {
        useAgentSettings,
        useTelegramConfig,
        useWhatsappConfig
    } from '$lib/modules/SalesAgent/hooks/useSalesAgentConfig'
    import SectionHeader from './SectionHeader.svelte'

    /**
     * Agente de ventas: cómo vende (persona, pagos, entregas, estilo, filtro) y
     * por dónde (Telegram, WhatsApp). Espejo de "Asistente de ventas" de placepos.
     */
    let { onBack }: { onBack: () => void } = $props()

    type Tab = 'behavior' | 'channels'
    let tab = $state<Tab>('behavior')

    const settings = useAgentSettings()
    const telegram = useTelegramConfig()
    const whatsapp = useWhatsappConfig()
</script>

<SectionHeader title="Agente de ventas" subtitle="Vende por WhatsApp y Telegram en tu nombre" {onBack} />

<div class="flex flex-col gap-5 px-5 pb-8">
    <Segmented
        ariaLabel="Configuración del agente"
        options={[
            { value: 'behavior', label: 'Cómo vende' },
            { value: 'channels', label: 'Canales' }
        ]}
        value={tab}
        onChange={(v) => (tab = v)}
    />

    {#if tab === 'behavior'}
        {#if $settings.isLoading}
            <SkeletonList rows={4} />
        {:else if $settings.isError || !$settings.data}
            <ScreenState kind="error" message={getErrorMessage($settings.error)} />
        {:else}
            <AgentBehaviorForm settings={$settings.data} />
        {/if}
    {:else}
        <div class="flex flex-col gap-4 motion-safe:animate-fade-in">
            {#if $whatsapp.isLoading || $telegram.isLoading}
                <SkeletonList rows={3} />
            {:else}
                {#if $whatsapp.data}<WhatsappChannelCard config={$whatsapp.data} />{/if}
                {#if $telegram.data}<TelegramChannelCard config={$telegram.data} />{/if}
                {#if $whatsapp.isError && $telegram.isError}
                    <ScreenState kind="error" message={getErrorMessage($telegram.error)} />
                {/if}
            {/if}
        </div>
    {/if}
</div>
