<script lang="ts">
    import { ArrowUp, Square } from '@lucide/svelte'

    interface Props {
        assistantName: string
        isStreaming: boolean
        disabled?: boolean
        /** Placeholder cuando está deshabilitado (p. ej. sin consultas del día). */
        disabledPlaceholder?: string
        /** Línea informativa del pie (p. ej. "Te quedan 3 consultas hoy"). */
        hint?: string | null
        seed?: { value: string; token: number } | null
        onsend: (text: string) => void
        onstop: () => void
    }
    let {
        assistantName,
        isStreaming,
        disabled = false,
        disabledPlaceholder,
        hint = null,
        seed = null,
        onsend,
        onstop
    }: Props = $props()

    let draft = $state('')
    let textarea: HTMLTextAreaElement | null = $state(null)
    const MAX_H = 140

    const canSend = $derived(draft.trim().length > 0 && !isStreaming && !disabled)

    function autogrow() {
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_H)}px`
    }

    $effect(() => {
        void draft
        autogrow()
    })

    // Sugerencia elegida en la bienvenida: entra al input y toma el foco.
    let lastSeed = 0
    $effect(() => {
        if (seed && seed.token !== lastSeed) {
            lastSeed = seed.token
            draft = seed.value
            textarea?.focus()
        }
    })

    function submit() {
        if (!canSend) return
        onsend(draft.trim())
        draft = ''
    }

    function onkeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }
</script>

<div
    class="relative z-10 shrink-0 px-3 pt-2"
    style="padding-bottom:calc(env(safe-area-inset-bottom) + 0.6rem)"
>
    <div
        class="flex items-end gap-2 rounded-[22px] border border-border/70 bg-card/85 py-1.5 pl-3.5 pr-1.5 backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-primary/45"
        style="box-shadow:0 10px 30px -16px rgba(15,23,42,0.4)"
    >
        <textarea
            bind:this={textarea}
            bind:value={draft}
            {onkeydown}
            rows="1"
            {disabled}
            placeholder={disabled
                ? (disabledPlaceholder ?? `${assistantName} no está disponible`)
                : `Pregúntale a ${assistantName}…`}
            class="max-h-[140px] flex-1 resize-none bg-transparent py-2 text-[14px] leading-[1.5] text-foreground outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
        ></textarea>

        {#if isStreaming}
            <button
                type="button"
                onclick={onstop}
                aria-label="Detener"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background active:scale-95"
            >
                <Square size={13} fill="currentColor" />
            </button>
        {:else}
            <button
                type="button"
                onclick={submit}
                disabled={!canSend}
                aria-label="Enviar"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-[opacity,transform] active:scale-95 disabled:bg-muted disabled:text-muted-foreground/50"
                style={canSend
                    ? 'background-image:linear-gradient(135deg,#1e7df0,#4f46e5);box-shadow:0 4px 12px -4px rgba(30,125,240,0.8)'
                    : ''}
            >
                <ArrowUp size={18} />
            </button>
        {/if}
    </div>
    <p class="mt-1 px-1 text-center text-[10.5px] text-muted-foreground/60">
        {hint ? `${hint} · ` : ''}La IA puede equivocarse. Verifica los datos importantes.
    </p>
</div>
