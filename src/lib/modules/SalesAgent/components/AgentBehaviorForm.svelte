<script lang="ts">
    import { untrack } from 'svelte'
    import { fly } from 'svelte/transition'
    import { LoaderCircle, Plus } from '@lucide/svelte'
    import { toast } from 'svelte-sonner'
    import { Segmented } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { easeOutStrong } from '$lib/utils/easing'
    import { getErrorMessage } from '$lib/utils/errors'
    import type { SalesBotSettings } from '$lib/api/requests/salesBot'
    import ChoiceCard from './ChoiceCard.svelte'
    import TextInput from './TextInput.svelte'
    import { useSaveAgentSettings } from '../hooks/useSalesAgentConfig'
    import { MAX_BOT_NAME_LENGTH, PERSONALITY_PRESETS } from '../utils/constants'
    import {
        appendExample,
        DELIVERY_MODE_OPTIONS,
        hasUnsavedChanges,
        MAX_PAYMENT_INSTRUCTIONS_LENGTH,
        MAX_PICKUP_ADDRESS_LENGTH,
        MAX_STYLE_LENGTH,
        OFF_TOPIC_LIMIT_OPTIONS,
        PAYMENT_METHOD_OPTIONS,
        STOCK_POLICY_OPTIONS,
        STYLE_STAGES,
        toAgentSettingsForm,
        toggleDeliveryMode,
        togglePaymentMethod,
        validateAgentSettings,
        type AgentSettingsFormErrors,
        type AgentSettingsFormState
    } from '../utils/agentSettingsLogic'

    /**
     * "Cómo vende": la persona y las reglas del agente, iguales en todos los
     * canales (espejo de AgentSettingsPanel de placepos). La barra de guardar
     * aparece solo cuando hay cambios.
     */
    let { settings }: { settings: SalesBotSettings } = $props()

    const save = useSaveAgentSettings()

    // El $effect de abajo resiembra cuando cambia lo guardado; esto es el arranque.
    let saved = $state<AgentSettingsFormState>(untrack(() => toAgentSettingsForm(settings)))
    let form = $state<AgentSettingsFormState>(untrack(() => toAgentSettingsForm(settings)))
    let errors = $state<AgentSettingsFormErrors>({})

    // Lo guardado cambió (otro dispositivo, o al guardar aquí): se resiembra.
    $effect(() => {
        const next = toAgentSettingsForm(settings)
        saved = next
        form = structuredClone(next)
        errors = {}
    })

    const dirty = $derived(hasUnsavedChanges(form, saved))

    const submit = () => {
        const result = validateAgentSettings($state.snapshot(form))
        if (!result.ok) {
            errors = result.errors
            toast.error('Revisa los campos marcados')
            return
        }
        errors = {}
        $save.mutate(result.payload, {
            onSuccess: () => toast.success('Listo: el agente ya vende así'),
            onError: (error) => toast.error(getErrorMessage(error) ?? 'No se pudo guardar. Inténtalo de nuevo.')
        })
    }
</script>

{#snippet section(title: string, caption: string)}
    <header class="mb-2.5 px-1">
        <h3 class="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
        <p class="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{caption}</p>
    </header>
{/snippet}

<div class="flex flex-col gap-7">
    <section aria-label="Identidad">
        {@render section('Quién atiende', 'Así se presenta en WhatsApp y Telegram.')}
        <div class="flex flex-col gap-3">
            <TextInput
                id="agent-name"
                label="Nombre del agente"
                bind:value={form.bot_name}
                placeholder="Ej: Valentina"
                maxlength={MAX_BOT_NAME_LENGTH}
                error={errors.bot_name}
            />
            <div role="radiogroup" aria-label="Personalidad" class="flex flex-col gap-2">
                {#each PERSONALITY_PRESETS as preset (preset.value)}
                    <ChoiceCard
                        role="radio"
                        checked={form.personality === preset.value}
                        label={preset.label}
                        description={preset.description}
                        icon={preset.icon}
                        onclick={() => (form.personality = preset.value)}
                    />
                {/each}
            </div>
        </div>
    </section>

    <section aria-label="Productos agotados">
        {@render section('Si un producto se agota', 'Qué le dice al cliente cuando no hay existencias.')}
        <div role="radiogroup" aria-label="Productos agotados" class="flex flex-col gap-2">
            {#each STOCK_POLICY_OPTIONS as option (option.value)}
                <ChoiceCard
                    role="radio"
                    checked={form.stock_policy === option.value}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    onclick={() => (form.stock_policy = option.value)}
                />
            {/each}
        </div>
    </section>

    <section aria-label="Formas de pago">
        {@render section('Formas de pago', 'Las que el agente ofrece al cerrar. Al menos una.')}
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {#each PAYMENT_METHOD_OPTIONS as option (option.value)}
                <ChoiceCard
                    role="checkbox"
                    checked={form.payment_methods.includes(option.value)}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    onclick={() => (form.payment_methods = togglePaymentMethod(form.payment_methods, option.value))}
                />
            {/each}
        </div>
        {#if errors.payment_methods}<p role="alert" class="mt-2 px-1 text-[12.5px] text-destructive">{errors.payment_methods}</p>{/if}
        <div class="mt-3">
            <TextInput
                id="agent-payment-instructions"
                label="Datos para pagar"
                bind:value={form.payment_instructions}
                multiline
                rows={2}
                maxlength={MAX_PAYMENT_INSTRUCTIONS_LENGTH}
                placeholder="Ej: Nequi 300 123 4567 a nombre de Esencia & Grano."
                hint="El agente los comparte cuando el cliente elige cómo pagar."
                error={errors.payment_instructions}
            />
        </div>
    </section>

    <section aria-label="Entregas">
        {@render section('Entregas', 'Cómo recibe el cliente su pedido. Al menos una.')}
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {#each DELIVERY_MODE_OPTIONS as option (option.value)}
                <ChoiceCard
                    role="checkbox"
                    checked={form.delivery_modes.includes(option.value)}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    onclick={() => (form.delivery_modes = toggleDeliveryMode(form.delivery_modes, option.value))}
                />
            {/each}
        </div>
        {#if errors.delivery_modes}<p role="alert" class="mt-2 px-1 text-[12.5px] text-destructive">{errors.delivery_modes}</p>{/if}
        {#if form.delivery_modes.includes('pickup')}
            <div class="mt-3" transition:fly={{ y: -6, duration: 200, easing: easeOutStrong }}>
                <TextInput
                    id="agent-pickup-address"
                    label="Dónde recogen"
                    bind:value={form.pickup_address}
                    maxlength={MAX_PICKUP_ADDRESS_LENGTH}
                    placeholder="Vacío = la dirección de Mi negocio"
                    error={errors.pickup_address}
                />
            </div>
        {/if}
    </section>

    <section aria-label="Estilo propio">
        {@render section('Tu estilo', 'Opcional. Cómo quieres que salude, venda y cierre. Toca una idea para sumarla.')}
        <div class="flex flex-col gap-5">
            {#each STYLE_STAGES as stage (stage.field)}
                <div class="flex flex-col gap-2">
                    <TextInput
                        id={`agent-${stage.field}`}
                        label={stage.label}
                        bind:value={form[stage.field]}
                        multiline
                        rows={2}
                        maxlength={MAX_STYLE_LENGTH}
                        placeholder={stage.placeholder}
                        hint={stage.hint}
                        error={errors[stage.field]}
                    />
                    <div class="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none]">
                        {#each stage.examples as example (example.label)}
                            {@const used = form[stage.field].includes(example.text)}
                            <button
                                type="button"
                                disabled={used}
                                onclick={() => (form[stage.field] = appendExample(form[stage.field], example.text))}
                                class={cn(
                                    'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] font-semibold transition-[transform,opacity] duration-150 ease-out active:scale-[0.96]',
                                    used ? 'bg-success/10 text-success opacity-80' : 'bg-foreground/[0.05] text-foreground'
                                )}
                            >
                                {#if !used}<Plus size={13} strokeWidth={2.5} />{/if}
                                {example.label}
                            </button>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <section aria-label="Mensajes sin sentido">
        {@render section(
            'Mensajes sin sentido',
            'Si alguien escribe solo para molestar, el agente se despide tras estos mensajes y deja de responder hasta que pregunte algo del negocio. Ahorra consumo.'
        )}
        <Segmented
            ariaLabel="Mensajes sin sentido antes de despedirse"
            options={OFF_TOPIC_LIMIT_OPTIONS.map((o) => ({ value: String(o.value), label: o.value === 0 ? 'No' : String(o.value) }))}
            value={String(form.off_topic_limit)}
            onChange={(v) => (form.off_topic_limit = Number(v))}
        />
        <p class="mt-2 px-1 text-[12.5px] text-muted-foreground">
            {form.off_topic_limit === 0
                ? 'Desactivado: responde todos los mensajes.'
                : `Se despide al ${form.off_topic_limit}.º mensaje seguido que no sea del negocio.`}
        </p>
    </section>
</div>

{#if dirty}
    <div
        class="sticky bottom-[calc(var(--dock-space)+10px)] z-20 mt-6"
        transition:fly={{ y: 24, duration: 260, easing: easeOutStrong }}
    >
        <div class="flex items-center gap-3 rounded-[20px] bg-foreground px-4 py-3 text-background shadow-[0_14px_32px_-12px_rgba(9,14,28,0.55)]">
            <p class="min-w-0 flex-1 text-[13.5px] font-medium">Tienes cambios sin guardar</p>
            <button
                type="button"
                onclick={() => (form = structuredClone($state.snapshot(saved)))}
                class="h-9 shrink-0 rounded-full px-3 text-[13.5px] font-semibold text-background/70 transition-transform active:scale-[0.96]"
            >
                Descartar
            </button>
            <button
                type="button"
                onclick={submit}
                disabled={$save.isPending}
                class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground transition-[transform,opacity] active:scale-[0.96] disabled:opacity-60"
            >
                {#if $save.isPending}<LoaderCircle size={15} class="animate-spin" />{/if}
                Guardar
            </button>
        </div>
    </div>
{/if}
