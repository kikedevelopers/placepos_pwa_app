<script lang="ts">
    import { Search, X } from '@lucide/svelte'

    interface Props {
        value: string
        placeholder: string
    }
    let { value = $bindable(), placeholder }: Props = $props()
</script>

<div class="flex h-11 items-center rounded-full border border-border bg-card px-4">
    <Search size={16} color="hsl(215, 16%, 55%)" strokeWidth={2} />
    <input
        bind:value
        {placeholder}
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="search"
        class="ml-2 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
    />
    {#if value}
        <button
            type="button"
            onclick={() => (value = '')}
            class="ml-1 transition-opacity active:opacity-60"
            aria-label="Limpiar búsqueda"
        >
            <X size={16} color="hsl(215, 16%, 55%)" />
        </button>
    {/if}
</div>
