<script lang="ts">
    import { Check } from '@lucide/svelte'

    /** Lista de opción única dentro de un sheet (como los selectores de iOS). */
    interface Props {
        options: readonly { id: string; label: string; hint?: string }[]
        value: string
        onChange: (id: string) => void
        ariaLabel: string
    }
    let { options, value, onChange, ariaLabel }: Props = $props()
</script>

<div class="surface group-rows overflow-hidden" role="radiogroup" aria-label={ariaLabel}>
    {#each options as option (option.id)}
        {@const selected = option.id === value}
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onclick={() => onChange(option.id)}
            class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05]"
        >
            <span class="min-w-0 flex-1">
                <span class="block text-[15px] {selected ? 'font-semibold text-foreground' : 'text-foreground'}">
                    {option.label}
                </span>
                {#if option.hint}
                    <span class="mt-0.5 block text-[12px] text-muted-foreground">{option.hint}</span>
                {/if}
            </span>
            {#if selected}
                <Check size={18} strokeWidth={2.6} class="shrink-0 text-primary" />
            {/if}
        </button>
    {/each}
</div>
