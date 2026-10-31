<script lang="ts">
    import { fly } from 'svelte/transition'
    import { Bot, LoaderCircle, Sparkles, X } from '@lucide/svelte'
    import { toast } from 'svelte-sonner'
    import AdaptiveSheet from '$lib/components/AdaptiveSheet.svelte'
    import { SkeletonList } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { easeOutStrong } from '$lib/utils/easing'
    import { getErrorMessage } from '$lib/utils/errors'
    import AttributesEditor from './AttributesEditor.svelte'
    import RelatedEditor from './RelatedEditor.svelte'
    import TagInput from './TagInput.svelte'
    import {
        applySuggestion,
        countMarks,
        diffSuggestion,
        EMPTY_MARKS,
        isProfileDirty,
        isProfileEmpty,
        PROFILE_LIMITS,
        toProfileForm,
        validateProfileForm,
        type AssistantProfileErrors,
        type AssistantProfileForm,
        type SuggestedMarks
    } from './assistantProfileLogic'
    import { useAssistantProfile, useSuggestAssistantProfile, useUpdateAssistantProfile } from './useAssistantProfile'

    /** Producto cuya ficha se edita (siempre el BASE). */
    export interface AssistantProfileTarget {
        id: number
        name: string
        /** Si se abrió desde una presentación, su nombre (la ficha es del base). */
        fromPresentation?: string
    }

    /**
     * Ficha "Para el asistente de ventas" (espejo del diálogo de placepos): qué
     * es el producto, para qué sirve, sus características, cómo lo piden y con
     * qué se relaciona. Con cambios sin guardar, cerrar pide confirmación.
     */
    let { target, onClose }: { target: AssistantProfileTarget; onClose: () => void } = $props()

    const query = useAssistantProfile(() => target.id)
    const update = useUpdateAssistantProfile(() => target.id)
    const suggest = useSuggestAssistantProfile(() => target.id)

    let saved = $state<AssistantProfileForm>(toProfileForm(null))
    let form = $state<AssistantProfileForm>(toProfileForm(null))
    let errors = $state<AssistantProfileErrors>({})
    let marks = $state<SuggestedMarks>(EMPTY_MARKS)
    let confirmDiscard = $state(false)
    let open = $state(true)

    $effect(() => {
        const data = $query.data
        if (!data) return
        // Solo se ESCRIBE estado aquí: leer `saved` volvería a disparar el
        // efecto (bucle infinito que deja el panel sin responder).
        saved = toProfileForm(data)
        form = toProfileForm(data)
        errors = {}
        marks = EMPTY_MARKS
    })

    const loading = $derived($query.isLoading)
    const dirty = $derived(isProfileDirty(form, saved))
    const empty = $derived(!loading && isProfileEmpty(form))
    const suggestedCount = $derived(countMarks(marks))

    const close = () => {
        open = false
        // Deja terminar la salida del panel antes de desmontarlo.
        setTimeout(onClose, 240)
    }

    const requestClose = () => {
        if (dirty && !$update.isPending) {
            confirmDiscard = true
            return
        }
        close()
    }

    const patch = (partial: Partial<AssistantProfileForm>) => {
        form = { ...form, ...partial }
        confirmDiscard = false
    }

    const handleSuggest = () => {
        $suggest.mutate(undefined, {
            onSuccess: (suggestion) => {
                const before = $state.snapshot(form)
                const next = applySuggestion(before, suggestion)
                marks = diffSuggestion(before, next)
                form = next
                confirmDiscard = false
            },
            onError: (error) =>
                toast.error(getErrorMessage(error) ?? 'La IA no pudo completar la ficha. Inténtalo de nuevo.')
        })
    }

    const handleSave = () => {
        const result = validateProfileForm($state.snapshot(form))
        if (!result.ok) {
            errors = result.errors
            return
        }
        errors = {}
        $update.mutate(result.payload, {
            onSuccess: () => {
                toast.success('Ficha del asistente guardada')
                saved = structuredClone($state.snapshot(form))
                close()
            },
            onError: (error) => toast.error(getErrorMessage(error) ?? 'No se pudo guardar la ficha')
        })
    }
</script>

{#snippet block(title: string, hint: string, forId: string | undefined, content: import('svelte').Snippet)}
    <section class="flex flex-col gap-2.5">
        <header class="px-0.5">
            {#if forId}
                <label for={forId} class="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</label>
            {:else}
                <h3 class="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
            {/if}
            <p class="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{hint}</p>
        </header>
        {@render content()}
    </section>
{/snippet}

<AdaptiveSheet {open} onClose={requestClose} ariaLabel="Ficha para el asistente" width={520}>
    <header class="flex items-start gap-3 px-5 pb-3 pt-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <Bot size={21} strokeWidth={2} />
        </span>
        <div class="min-w-0 flex-1">
            <h2 class="text-[19px] font-semibold tracking-[-0.02em] text-foreground">Ficha para el asistente</h2>
            <p class="truncate text-[13px] text-muted-foreground">{target.name}</p>
        </div>
        <button
            type="button"
            aria-label="Cerrar"
            onclick={requestClose}
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-transform duration-150 active:scale-[0.92]"
        >
            <X size={17} strokeWidth={2.2} />
        </button>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-foreground/[0.06] px-5 pb-6 pt-4">
        {#if target.fromPresentation}
            <p class="mb-4 rounded-[14px] bg-foreground/[0.04] px-3.5 py-2.5 text-[12.5px] leading-snug text-muted-foreground">
                Abriste «{target.fromPresentation}». La ficha es del producto base y la comparten todas sus presentaciones.
            </p>
        {/if}

        {#if loading}
            <SkeletonList rows={4} />
        {:else if $query.isError}
            <p role="alert" class="rounded-[14px] bg-destructive/[0.07] px-3.5 py-3 text-[13.5px] text-destructive">
                No se pudo cargar la ficha. Revisa tu conexión e inténtalo de nuevo.
            </p>
        {:else}
            <div class="flex flex-col gap-7">
                {#if empty}
                    <!-- La forma más rápida de empezar: que la IA proponga. -->
                    <div class="flex flex-col gap-3 rounded-[18px] bg-primary/[0.06] p-4">
                        <div>
                            <p class="text-[14.5px] font-semibold text-foreground">Empieza en segundos</p>
                            <p class="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                                La IA propone la ficha a partir del nombre y las presentaciones. Tú la revisas y guardas.
                            </p>
                        </div>
                        <button
                            type="button"
                            onclick={handleSuggest}
                            disabled={$suggest.isPending}
                            class="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primary text-[14.5px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.65)] transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-60"
                        >
                            {#if $suggest.isPending}<LoaderCircle size={17} class="animate-spin" />{:else}<Sparkles size={17} strokeWidth={2.2} />{/if}
                            {$suggest.isPending ? 'Pensando…' : 'Completar con IA'}
                        </button>
                    </div>
                {:else if suggestedCount > 0}
                    <p
                        class="flex items-start gap-2 rounded-[14px] bg-primary/[0.06] px-3.5 py-2.5 text-[12.5px] leading-snug text-foreground"
                        transition:fly={{ y: -6, duration: 200, easing: easeOutStrong }}
                    >
                        <Sparkles size={14} strokeWidth={2.2} class="mt-px shrink-0 text-primary" />
                        La IA propuso {suggestedCount} {suggestedCount === 1 ? 'dato' : 'datos'} (resaltados). Revísalos y quita lo que no aplique antes de guardar.
                    </p>
                {/if}

                {#snippet description()}
                    <div class="relative">
                        <textarea
                            id="ap-description"
                            rows={4}
                            maxlength={PROFILE_LIMITS.description}
                            value={form.description}
                            placeholder="Ej: Contenedor de icopor con dos compartimentos, ideal para hamburguesa con papas."
                            oninput={(e) => {
                                patch({ description: e.currentTarget.value })
                                if (marks.description) marks = { ...marks, description: false }
                            }}
                            class={cn(
                                'w-full resize-none rounded-[14px] px-3.5 pb-7 pt-3 text-[15px] leading-snug text-foreground outline-none transition-[background-color,box-shadow] duration-150 placeholder:text-muted-foreground/75 focus:bg-card focus:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]',
                                marks.description ? 'bg-primary/[0.07]' : 'bg-foreground/[0.055]'
                            )}
                        ></textarea>
                        <span class="pointer-events-none absolute bottom-2.5 right-3.5 text-[11.5px] tabular-nums text-muted-foreground/80">
                            {form.description.length}/{PROFILE_LIMITS.description}
                        </span>
                    </div>
                    {#if errors.description}<p role="alert" class="px-0.5 text-[12.5px] text-destructive">{errors.description}</p>{/if}
                {/snippet}
                {@render block('Qué es', 'En una o dos frases, como se lo explicarías a un cliente.', 'ap-description', description)}

                {#snippet uses()}
                    <TagInput id="ap-uses" placeholder="Ej: hamburguesa con papas" tags={form.uses} suggested={marks.uses} onChange={(v) => patch({ uses: v })} />
                {/snippet}
                {@render block('Para qué sirve', 'Usos o necesidades que resuelve. Así lo encuentra cuando el cliente dice «necesito algo para…».', 'ap-uses', uses)}

                {#snippet attributes()}
                    <AttributesEditor
                        attributes={form.attributes}
                        suggested={marks.attributes}
                        error={errors.attributes}
                        onChange={(v) => {
                            patch({ attributes: v })
                            if (errors.attributes) errors = { ...errors, attributes: undefined }
                        }}
                    />
                {/snippet}
                {@render block('Características', 'Datos que ayudan a elegir: tamaño, material, cantidad, sabor…', undefined, attributes)}

                {#snippet aliases()}
                    <TagInput id="ap-aliases" placeholder="Ej: portacomida, caja de hamburguesa" tags={form.aliases} suggested={marks.aliases} onChange={(v) => patch({ aliases: v })} />
                {/snippet}
                {@render block('Cómo lo piden los clientes', 'Nombres coloquiales o de marca con los que te lo piden.', 'ap-aliases', aliases)}

                {#snippet relatedBlock()}
                    <RelatedEditor productId={target.id} related={form.related} onChange={(v) => patch({ related: v })} />
                {/snippet}
                {@render block('Productos relacionados', 'Lo que el agente ofrece junto a este o en su lugar.', undefined, relatedBlock)}
            </div>
        {/if}
    </div>

    <footer class="shrink-0 border-t border-foreground/[0.06] bg-card/95 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 backdrop-blur-md">
        {#if confirmDiscard}
            <div class="flex flex-col gap-2.5" transition:fly={{ y: 8, duration: 180, easing: easeOutStrong }}>
                <p class="text-center text-[13.5px] font-medium text-foreground">Tienes cambios sin guardar.</p>
                <div class="grid grid-cols-2 gap-2.5">
                    <button type="button" onclick={close} class="h-12 rounded-[16px] bg-destructive/[0.08] text-[15px] font-semibold text-destructive transition-transform active:scale-[0.97]">
                        Descartar
                    </button>
                    <button type="button" onclick={() => (confirmDiscard = false)} class="h-12 rounded-[16px] bg-foreground/[0.06] text-[15px] font-semibold text-foreground transition-transform active:scale-[0.97]">
                        Seguir editando
                    </button>
                </div>
            </div>
        {:else}
            <div class="flex items-center gap-2.5">
                {#if !empty && !loading && !$query.isError}
                    <button
                        type="button"
                        onclick={handleSuggest}
                        disabled={$suggest.isPending}
                        aria-label="Completar con IA"
                        class="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[16px] bg-primary/10 px-4 text-[14.5px] font-semibold text-primary transition-[transform,opacity] active:scale-[0.97] disabled:opacity-60"
                    >
                        {#if $suggest.isPending}<LoaderCircle size={17} class="animate-spin" />{:else}<Sparkles size={17} strokeWidth={2.2} />{/if}
                        {$suggest.isPending ? 'Pensando…' : 'IA'}
                    </button>
                {/if}
                <button
                    type="button"
                    onclick={handleSave}
                    disabled={!dirty || $update.isPending || loading}
                    class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.65)] transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-45 disabled:shadow-none"
                >
                    {#if $update.isPending}<LoaderCircle size={17} class="animate-spin" />{/if}
                    Guardar ficha
                </button>
            </div>
        {/if}
    </footer>
</AdaptiveSheet>
