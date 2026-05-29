<script lang="ts" module>
    export type AutocompleteOption = { id: number; label: string }
    export type CreateConfig = {
        pending: boolean
        error?: string
        extra?: { placeholder: string }
        onCreate: (name: string, extra: number | null) => void
    }
</script>

<script lang="ts">
    import { Check, Plus, X } from '@lucide/svelte'
    import { parseDecimal } from '$lib/utils/numbers'
    import Spinner from '$lib/components/Spinner.svelte'

    interface Props {
        label: string
        placeholder: string
        value: number | null
        options: AutocompleteOption[]
        onSelect: (id: number | null) => void
        create?: CreateConfig
    }
    let { label, placeholder, value, options, onSelect, create }: Props = $props()

    const MAX_VISIBLE = 6

    const selected = $derived(options.find((o) => o.id === value) ?? null)
    const selectedLabel = $derived(selected?.label)

    let query = $state('')
    let open = $state(false)
    let extraOpen = $state(false)
    let extra = $state('')

    // Solo sincroniza el texto cuando hay una opción coincidente (evita parpadeo
    // a vacío si el value apunta a una opción aún no cargada tras crearla).
    $effect(() => {
        if (selectedLabel !== undefined) query = selectedLabel
    })

    const trimmed = $derived(query.trim())
    const filtered = $derived(
        options.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()))
    )
    const exactMatch = $derived(
        options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase())
    )
    const showCreate = $derived(!!create && trimmed.length > 0 && !exactMatch)

    const pick = (option: AutocompleteOption) => {
        onSelect(option.id)
        query = option.label
        open = false
        extraOpen = false
    }
    const clear = () => {
        onSelect(null)
        query = ''
        open = false
        extraOpen = false
    }
    const startCreate = () => {
        if (create?.extra) {
            extraOpen = true
            return
        }
        create?.onCreate(trimmed, null)
        open = false
    }
    const confirmCreate = () => {
        const extraValue = create?.extra ? parseDecimal(extra) : null
        if (create?.extra && (!Number.isFinite(extraValue ?? NaN) || (extraValue ?? 0) <= 0)) return
        create?.onCreate(trimmed, extraValue)
        extra = ''
        extraOpen = false
        open = false
    }
</script>

<div>
    <span class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70">{label}</span>
    <div
        class="flex h-[52px] items-center rounded-xl px-3.5"
        style="border:1.5px solid {open ? 'hsl(217, 91%, 50%)' : 'hsla(214, 32%, 89%, 0.9)'};background-color:hsla(0,0%,100%,0.7)"
    >
        <input
            bind:value={query}
            {placeholder}
            oninput={() => {
                open = true
                extraOpen = false
            }}
            onfocus={() => (open = true)}
            class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
        />
        {#if query}
            <button
                type="button"
                onclick={clear}
                class="ml-2 transition-opacity active:opacity-60"
                aria-label="Limpiar"
            >
                <X size={16} color="hsl(215, 16%, 47%)" />
            </button>
        {/if}
    </div>

    {#if open}
        <div class="mt-2 overflow-hidden rounded-xl border border-border bg-card">
            {#each filtered.slice(0, MAX_VISIBLE) as option (option.id)}
                <button
                    type="button"
                    onclick={() => pick(option)}
                    class="flex w-full items-center justify-between border-b border-border/50 px-3.5 py-3 text-left active:bg-secondary/60"
                >
                    <span class="text-sm text-foreground">{option.label}</span>
                    {#if value === option.id}
                        <Check size={16} color="hsl(217, 91%, 50%)" />
                    {/if}
                </button>
            {/each}

            {#if showCreate && !extraOpen}
                <button
                    type="button"
                    onclick={startCreate}
                    class="flex w-full items-center gap-2 px-3.5 py-3 text-left active:bg-secondary/60"
                >
                    <Plus size={16} color="hsl(217, 91%, 50%)" />
                    <span class="text-sm font-medium text-primary">Crear «{trimmed}»</span>
                </button>
            {/if}

            {#if extraOpen && create?.extra}
                <div class="flex items-center gap-2 px-3 py-2.5">
                    <div class="flex h-10 flex-1 items-center rounded-lg border border-border px-3">
                        <input
                            bind:value={extra}
                            placeholder={create.extra.placeholder}
                            inputmode="decimal"
                            class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
                        />
                    </div>
                    <button
                        type="button"
                        onclick={confirmCreate}
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary transition-opacity active:opacity-80"
                        aria-label="Confirmar"
                    >
                        {#if create.pending}
                            <Spinner size={18} color="white" />
                        {:else}
                            <Check size={18} color="white" strokeWidth={2.5} />
                        {/if}
                    </button>
                </div>
            {/if}

            {#if filtered.length === 0 && !showCreate}
                <p class="px-3.5 py-3 text-xs text-muted-foreground">Sin coincidencias.</p>
            {/if}
        </div>
    {/if}

    {#if create?.error}
        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{create.error}</p>
    {/if}
</div>
