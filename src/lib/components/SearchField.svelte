<script lang="ts">
    import { Search, X } from '@lucide/svelte'

    /** Búsqueda estilo iOS: campo relleno gris, sin borde, con botón de limpiar. */
    interface Props {
        value: string
        placeholder: string
        ariaLabel?: string
    }
    let { value = $bindable(), placeholder, ariaLabel }: Props = $props()
</script>

<label
    class="flex h-10 items-center gap-2 rounded-[12px] bg-foreground/[0.055] px-3 transition-[background-color,box-shadow] duration-150 focus-within:bg-card focus-within:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]"
>
    <Search size={16} class="shrink-0 text-muted-foreground" strokeWidth={2.2} />
    <input
        bind:value
        {placeholder}
        aria-label={ariaLabel ?? placeholder}
        type="search"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="search"
        class="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden"
    />
    {#if value}
        <button
            type="button"
            onclick={() => (value = '')}
            class="-mr-1 flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90"
            aria-label="Limpiar búsqueda"
        >
            <span class="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muted-foreground/45">
                <X size={11} color="white" strokeWidth={3} />
            </span>
        </button>
    {/if}
</label>
