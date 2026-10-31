<script lang="ts">
    import { BadgeCheck, LoaderCircle, Send } from '@lucide/svelte'
    import { toast } from 'svelte-sonner'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import type { SalesBotConfig } from '$lib/api/requests/salesBot'
    import TextInput from './TextInput.svelte'
    import { useSaveTelegramConfig, useValidateTelegramToken } from '../hooks/useSalesAgentConfig'
    import { validateSalesBotForm, type SalesBotFormErrors, type SalesBotFormState } from '../utils/formLogic'

    /**
     * Canal Telegram: el bot del negocio (token de @BotFather). El token nunca
     * vuelve del servidor: vacío = conservar el guardado. Se puede verificar
     * antes de guardar.
     */
    let { config }: { config: SalesBotConfig } = $props()

    const save = useSaveTelegramConfig()
    const verify = useValidateTelegramToken()

    let form = $state<SalesBotFormState>({ owner_chat_id: '', token: '', enabled: false })
    let errors = $state<SalesBotFormErrors>({})
    let verified = $state<string | null>(null)

    $effect(() => {
        form = { owner_chat_id: config.owner_chat_id ?? '', token: '', enabled: config.enabled }
        errors = {}
        verified = null
    })

    const ready = $derived(Boolean(config.enabled && config.bot_username))

    const checkToken = () => {
        const token = form.token.trim()
        if (!token) return
        verified = null
        $verify.mutate(token, {
            onSuccess: (result) => {
                if (result.valid) verified = result.bot_username ? `@${result.bot_username}` : 'Token válido'
                else errors = { token: 'Telegram no reconoce ese token. Cópialo de nuevo desde @BotFather.' }
            },
            onError: (error) => (errors = { token: getErrorMessage(error) ?? 'No se pudo verificar el token.' })
        })
    }

    const submit = () => {
        const result = validateSalesBotForm($state.snapshot(form), { hasSavedToken: config.has_token })
        if (!result.ok) {
            errors = result.errors
            return
        }
        errors = {}
        $save.mutate(result.payload, {
            onSuccess: () => toast.success('Telegram guardado'),
            onError: (error) => toast.error(getErrorMessage(error) ?? 'No se pudo guardar Telegram.')
        })
    }
</script>

<section class="surface flex flex-col gap-4 p-4" aria-label="Telegram">
    <header class="flex items-center gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#229ED9] text-white">
            <Send size={19} strokeWidth={2.2} />
        </span>
        <div class="min-w-0 flex-1">
            <p class="text-[15.5px] font-semibold tracking-[-0.01em] text-foreground">Telegram</p>
            <p class="truncate text-[12.5px] text-muted-foreground">
                {config.bot_username ? `@${config.bot_username}` : 'Sin bot conectado'}
            </p>
        </div>
        <span
            class="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold {ready
                ? 'bg-success/10 text-success'
                : 'bg-foreground/[0.06] text-muted-foreground'}"
        >
            <span class="h-1.5 w-1.5 rounded-full {ready ? 'bg-success' : 'bg-muted-foreground/60'}"></span>
            {ready ? 'Activo' : 'Apagado'}
        </span>
    </header>

    <ToggleSwitch
        checked={form.enabled}
        onChange={(v) => (form.enabled = v)}
        label="Responder por Telegram"
        description="El agente atiende a quien le escriba al bot."
    />

    <div class="flex flex-col gap-2">
        <TextInput
            id="telegram-token"
            label="Token del bot"
            type="password"
            bind:value={form.token}
            placeholder={config.has_token ? 'Guardado · pega uno nuevo para cambiarlo' : 'Pega el token de @BotFather'}
            error={errors.token}
            oninput={() => ((verified = null), (errors = {}))}
        />
        {#if form.token.trim()}
            <div class="flex items-center gap-2 px-0.5">
                <button
                    type="button"
                    onclick={checkToken}
                    disabled={$verify.isPending}
                    class="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 text-[12.5px] font-semibold text-foreground transition-transform active:scale-[0.96] disabled:opacity-60"
                >
                    {#if $verify.isPending}<LoaderCircle size={14} class="animate-spin" />{/if}
                    Verificar token
                </button>
                {#if verified}
                    <span class="inline-flex items-center gap-1 text-[12.5px] font-semibold text-success">
                        <BadgeCheck size={15} strokeWidth={2.3} />
                        {verified}
                    </span>
                {/if}
            </div>
        {/if}
    </div>

    <TextInput
        id="telegram-owner"
        label="Chat de avisos (opcional)"
        bind:value={form.owner_chat_id}
        inputmode="numeric"
        placeholder="Ej: 123456789"
        hint="Tu chat de Telegram: el bot te escribe ahí cada pedido que cierre."
    />

    <button
        type="button"
        onclick={submit}
        disabled={$save.isPending}
        class="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.65)] transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-60"
    >
        {#if $save.isPending}<LoaderCircle size={17} class="animate-spin" />{/if}
        Guardar Telegram
    </button>
</section>
