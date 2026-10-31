<script lang="ts">
    import { Plus, Sparkles, X } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import type { ProductAttribute } from '$lib/api/requests/productAssistant'
    import { addAttributeRow, PROFILE_LIMITS, removeAt, updateAttribute } from './assistantProfileLogic'

    /** Características "nombre: valor" (Compartimentos: 2). Una fila por característica. */
    interface Props {
        attributes: ProductAttribute[]
        suggested: Set<string>
        error?: string
        onChange: (attributes: ProductAttribute[]) => void
    }
    let { attributes, suggested, error, onChange }: Props = $props()

    const FIELD =
        'h-11 min-w-0 rounded-[12px] bg-foreground/[0.055] px-3 text-[14.5px] text-foreground outline-none transition-[background-color,box-shadow] duration-150 placeholder:text-muted-foreground/75 focus:bg-card focus:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]'
</script>

<div class="flex flex-col gap-2">
    {#each attributes as attribute, index (index)}
        {@const isSuggested = suggested.has(attribute.name.trim().toLowerCase())}
        <div class={cn('flex items-center gap-2 rounded-[14px]', isSuggested && 'bg-primary/[0.05] p-1.5')}>
            {#if isSuggested}<Sparkles size={13} strokeWidth={2.2} class="shrink-0 text-primary" aria-label="Propuesto por la IA" />{/if}
            <input
                aria-label="Característica"
                placeholder="Característica"
                value={attribute.name}
                maxlength={PROFILE_LIMITS.attributeName}
                oninput={(e) => onChange(updateAttribute(attributes, index, { name: e.currentTarget.value }))}
                class={cn(FIELD, 'w-[42%]')}
            />
            <input
                aria-label="Valor"
                placeholder="Valor"
                value={attribute.value}
                maxlength={PROFILE_LIMITS.attributeValue}
                oninput={(e) => onChange(updateAttribute(attributes, index, { value: e.currentTarget.value }))}
                class={cn(FIELD, 'flex-1')}
            />
            <button
                type="button"
                aria-label="Quitar característica"
                onclick={() => onChange(removeAt(attributes, index))}
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[transform,background-color] duration-150 active:scale-90 active:bg-foreground/10"
            >
                <X size={16} strokeWidth={2.3} />
            </button>
        </div>
    {/each}
    {#if error}<p role="alert" class="px-0.5 text-[12.5px] text-destructive">{error}</p>{/if}
    {#if attributes.length < PROFILE_LIMITS.attributes}
        <button
            type="button"
            onclick={() => onChange(addAttributeRow(attributes))}
            class="inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3.5 text-[13.5px] font-semibold text-foreground transition-transform duration-150 active:scale-[0.96]"
        >
            <Plus size={15} strokeWidth={2.4} />
            Agregar característica
        </button>
    {/if}
</div>
