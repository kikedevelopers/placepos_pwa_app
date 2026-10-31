<script lang="ts">
    import { Plus, Sparkles, X } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import { addTags, PROFILE_LIMITS, removeAt } from './assistantProfileLogic'

    /**
     * Etiquetas (usos, cómo lo piden). Se escriben y se agregan con Enter, coma o
     * el botón +; también se pegan varias separadas por coma. Las que propuso la
     * IA llevan un destello hasta que se guarde.
     */
    interface Props {
        id: string
        tags: string[]
        placeholder: string
        suggested: Set<string>
        onChange: (tags: string[]) => void
    }
    let { id, tags, placeholder, suggested, onChange }: Props = $props()

    let draft = $state('')
    const full = $derived(tags.length >= PROFILE_LIMITS.listItems)

    const commit = () => {
        if (!draft.trim()) return
        onChange(addTags(tags, draft))
        draft = ''
    }
</script>

<div class="flex flex-col gap-2">
    {#if tags.length > 0}
        <ul class="flex flex-wrap gap-1.5">
            {#each tags as tag, index (tag)}
                {@const isSuggested = suggested.has(tag.toLowerCase())}
                <li
                    class={cn(
                        'inline-flex h-8 items-center gap-1 rounded-full pl-3 pr-1 text-[13px] font-medium',
                        isSuggested ? 'bg-primary/10 text-primary' : 'bg-foreground/[0.06] text-foreground'
                    )}
                >
                    {#if isSuggested}<Sparkles size={12} strokeWidth={2.2} aria-label="Propuesto por la IA" />{/if}
                    {tag}
                    <button
                        type="button"
                        aria-label={`Quitar ${tag}`}
                        onclick={() => onChange(removeAt(tags, index))}
                        class="flex h-6 w-6 items-center justify-center rounded-full transition-[transform,background-color] duration-150 active:scale-90 active:bg-foreground/10"
                    >
                        <X size={13} strokeWidth={2.4} />
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
    {#if !full}
        <div class="flex items-center gap-2 rounded-[14px] bg-foreground/[0.055] pl-3.5 pr-1.5 transition-[background-color,box-shadow] duration-150 focus-within:bg-card focus-within:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]">
            <input
                {id}
                bind:value={draft}
                placeholder={tags.length === 0 ? placeholder : 'Agregar otro…'}
                enterkeyhint="done"
                autocomplete="off"
                maxlength={PROFILE_LIMITS.tag * 3}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault()
                        commit()
                    }
                }}
                onblur={commit}
                class="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/75"
            />
            <button
                type="button"
                aria-label="Agregar"
                disabled={!draft.trim()}
                onclick={commit}
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[transform,opacity] duration-150 active:scale-90 disabled:opacity-30"
            >
                <Plus size={17} strokeWidth={2.5} />
            </button>
        </div>
    {/if}
</div>
