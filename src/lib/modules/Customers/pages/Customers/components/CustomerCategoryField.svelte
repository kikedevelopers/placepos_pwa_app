<script lang="ts">
    import { Check, ChevronsUpDown, Plus, Search, Tag } from '@lucide/svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useCustomerCategories } from '$lib/modules/CustomerCategories/hooks/useCustomerCategories'
    import { useCustomerCategoryMutations } from '$lib/modules/CustomerCategories/hooks/useCustomerCategoryMutations'

    /**
     * Select de categoría ESPECIAL del cliente con buscador y creación inline
     * (equivalente al Combobox del formulario de producto en placepos). Abre un
     * bottom-sheet con búsqueda; "Crear nueva categoría" muestra un input inline
     * que crea la categoría en pos_api y la selecciona al vuelo.
     */
    interface Props {
        value: number | null
        onChange: (value: number | null) => void
        label?: string
    }
    let { value, onChange, label = 'Categoría' }: Props = $props()

    const query = useCustomerCategories()
    const { create } = useCustomerCategoryMutations()

    let open = $state(false)
    let search = $state('')
    let creating = $state(false)
    let newName = $state('')
    let createError = $state('')

    const categories = $derived($query.data ?? [])
    const selected = $derived(categories.find((c) => c.id === value) ?? null)
    const filtered = $derived.by(() => {
        const q = search.trim().toLowerCase()
        if (!q) return categories
        return categories.filter((c) => c.name.toLowerCase().includes(q))
    })

    const openSheet = () => {
        open = true
        search = ''
        creating = false
        newName = ''
        createError = ''
    }

    const choose = (id: number | null) => {
        onChange(id)
        open = false
    }

    const startCreate = () => {
        creating = true
        newName = search.trim()
        createError = ''
    }

    const confirmCreate = () => {
        const name = newName.trim()
        createError = ''
        if (!name) {
            createError = 'El nombre es requerido'
            return
        }
        $create.mutate(
            { name },
            {
                onSuccess: (cat) => {
                    onChange(cat.id)
                    open = false
                    creating = false
                    newName = ''
                    search = ''
                },
                onError: (error) => {
                    createError = getErrorMessage(error) ?? 'No se pudo crear la categoría.'
                }
            }
        )
    }
</script>

<div>
    {#if label}
        <span class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70">{label}</span>
    {/if}
    <PressableScale onclick={openSheet} class="block w-full" ariaLabel={label}>
        <span
            class="flex h-[52px] w-full items-center gap-3 rounded-[14px] px-3.5"
            style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
        >
            <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style="background-color:hsla(217,91%,50%,0.12)"
            >
                <Tag size={17} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </span>
            <span class="flex min-w-0 flex-1 flex-col text-left">
                <span
                    class="truncate text-base {selected
                        ? 'font-medium text-foreground'
                        : 'text-[hsl(215,16%,62%)]'}"
                >
                    {selected ? selected.name : 'Sin categoría'}
                </span>
            </span>
            <ChevronsUpDown size={18} color="hsl(215, 16%, 55%)" strokeWidth={2} />
        </span>
    </PressableScale>
</div>

<BottomSheet {open} title="Categoría" onClose={() => (open = false)}>
    {#if creating}
        <div class="flex flex-col gap-3 pb-1">
            <label class="ml-0.5 text-[13px] font-semibold text-foreground/70" for="new-category">
                Nueva categoría
            </label>
            <input
                id="new-category"
                bind:value={newName}
                placeholder="Ej: Cliente Redes Sociales"
                maxlength={100}
                class="h-[52px] w-full rounded-[14px] px-3.5 text-base text-foreground outline-none"
                style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
            />
            {#if createError}
                <span class="ml-0.5 text-xs text-destructive">{createError}</span>
            {/if}
            <div class="flex gap-2 pt-1">
                <button
                    type="button"
                    onclick={() => (creating = false)}
                    class="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground active:opacity-70"
                >
                    Cancelar
                </button>
                <div class="flex-1">
                    <PrimaryButton
                        label="Crear"
                        loading={$create.isPending}
                        onclick={confirmCreate}
                    />
                </div>
            </div>
        </div>
    {:else}
        <div class="flex flex-col gap-2 pb-1">
            <!-- Buscador -->
            <div
                class="flex items-center gap-2 rounded-[14px] px-3.5"
                style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
            >
                <Search size={17} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                <input
                    bind:value={search}
                    placeholder="Buscar categoría..."
                    class="h-[48px] w-full bg-transparent text-base text-foreground outline-none"
                />
            </div>

            <!-- Crear nueva categoría -->
            <PressableScale onclick={startCreate} class="block w-full" ariaLabel="Crear nueva categoría">
                <span
                    class="flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3"
                >
                    <Plus size={18} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
                    <span class="text-sm font-semibold text-primary">Crear nueva categoría</span>
                </span>
            </PressableScale>

            <!-- Sin categoría -->
            <PressableScale onclick={() => choose(null)} class="block w-full" ariaLabel="Sin categoría">
                <span
                    class="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 {value === null
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card'}"
                >
                    <span class="flex-1 text-left text-sm font-medium text-muted-foreground">
                        Sin categoría
                    </span>
                    {#if value === null}
                        <Check size={17} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
                    {/if}
                </span>
            </PressableScale>

            {#each filtered as cat (cat.id)}
                {@const active = cat.id === value}
                <PressableScale onclick={() => choose(cat.id)} class="block w-full" ariaLabel={cat.name}>
                    <span
                        class="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 {active
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border bg-card'}"
                    >
                        <span class="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground">
                            {cat.name}
                        </span>
                        {#if active}
                            <Check size={17} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
                        {/if}
                    </span>
                </PressableScale>
            {/each}

            {#if categories.length > 0 && filtered.length === 0}
                <p class="px-1 py-3 text-center text-sm text-muted-foreground">Sin resultados.</p>
            {/if}
        </div>
    {/if}
</BottomSheet>
