<script lang="ts">
    import { ArrowLeft } from '@lucide/svelte'

    interface Props {
        title: string
        subtitle?: string
        onBack: () => void
    }
    let { title, subtitle, onBack }: Props = $props()
</script>

<header class="flex items-center gap-2 px-3 pb-3 pt-4">
    <button
        type="button"
        onclick={onBack}
        aria-label="Volver"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity active:opacity-60"
    >
        <ArrowLeft size={22} color="hsl(215, 16%, 40%)" strokeWidth={2.2} />
    </button>
    <div class="min-w-0">
        <h1 class="truncate text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {#if subtitle}
            <p class="truncate text-xs text-muted-foreground">{subtitle}</p>
        {/if}
    </div>
</header>
