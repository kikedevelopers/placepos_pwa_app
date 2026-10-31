<script lang="ts">
    import { LoaderCircle, MessageCircle, Monitor } from '@lucide/svelte'
    import { toast } from 'svelte-sonner'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import type { WhatsappBotConfig } from '$lib/api/requests/salesBot'
    import TextInput from './TextInput.svelte'
    import { useSaveWhatsappConfig } from '../hooks/useSalesAgentConfig'
    import { buildWhatsappPayload, type WhatsappFormState } from '../utils/whatsappFormLogic'
    import { formatPhone } from '$lib/modules/AgentOrders/utils/agentOrders'

    /**
     * Canal WhatsApp. El número se conecta escaneando el QR en PlacePOS de
     * escritorio (la sesión vive en ese equipo); aquí se activa o apaga el
     * agente y se elige el número que recibe los avisos.
     */
    let { config }: { config: WhatsappBotConfig } = $props()

    const save = useSaveWhatsappConfig()
    let form = $state<WhatsappFormState>({ owner_chat_id: '', enabled: false })

    $effect(() => {
        form = { owner_chat_id: config.owner_chat_id ?? '', enabled: config.enabled }
    })

    const submit = () => {
        $save.mutate(buildWhatsappPayload($state.snapshot(form)), {
            onSuccess: () => toast.success('WhatsApp guardado'),
            onError: (error) => toast.error(getErrorMessage(error) ?? 'No se pudo guardar WhatsApp.')
        })
    }
</script>

<section class="surface flex flex-col gap-4 p-4" aria-label="WhatsApp">
    <header class="flex items-center gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#25D366] text-white">
            <MessageCircle size={19} strokeWidth={2.2} />
        </span>
        <div class="min-w-0 flex-1">
            <p class="text-[15.5px] font-semibold tracking-[-0.01em] text-foreground">WhatsApp</p>
            <p class="truncate text-[12.5px] text-muted-foreground">
                {config.owner_chat_id ? `Avisos a ${formatPhone(config.owner_chat_id)}` : 'Sin número de avisos'}
            </p>
        </div>
        <span
            class="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold {config.enabled
                ? 'bg-success/10 text-success'
                : 'bg-foreground/[0.06] text-muted-foreground'}"
        >
            <span class="h-1.5 w-1.5 rounded-full {config.enabled ? 'bg-success' : 'bg-muted-foreground/60'}"></span>
            {config.enabled ? 'Activo' : 'Apagado'}
        </span>
    </header>

    <div class="flex gap-2.5 rounded-[14px] bg-foreground/[0.04] px-3.5 py-3">
        <Monitor size={16} strokeWidth={2.1} class="mt-0.5 shrink-0 text-muted-foreground" />
        <p class="text-[12.5px] leading-snug text-muted-foreground">
            El número se conecta escaneando el QR en PlacePOS de escritorio. El agente responde mientras
            PlacePOS esté abierto en ese equipo.
        </p>
    </div>

    <ToggleSwitch
        checked={form.enabled}
        onChange={(v) => (form.enabled = v)}
        label="Responder por WhatsApp"
        description="El agente atiende los mensajes que lleguen a ese número."
    />

    <TextInput
        id="whatsapp-owner"
        label="Número de avisos (opcional)"
        bind:value={form.owner_chat_id}
        inputmode="tel"
        placeholder="Ej: 573001234567"
        hint="Tu WhatsApp personal, con código de país: ahí te llega cada pedido que cierre."
    />

    <button
        type="button"
        onclick={submit}
        disabled={$save.isPending}
        class="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.65)] transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-60"
    >
        {#if $save.isPending}<LoaderCircle size={17} class="animate-spin" />{/if}
        Guardar WhatsApp
    </button>
</section>
