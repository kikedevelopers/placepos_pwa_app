<script lang="ts">
    import { ChevronLeft } from '@lucide/svelte'

    /** Cabecera de una sección de Configuración: "‹ Configuración" + título grande. */
    interface Props {
        title: string
        subtitle?: string
        onBack: () => void
    }
    let { title, subtitle, onBack }: Props = $props()
</script>

<header class="flex flex-col gap-1 px-5 pb-4 pt-3">
    <button
        type="button"
        onclick={onBack}
        class="-ml-1.5 flex w-fit items-center gap-0.5 rounded-full py-1 pr-2 text-[15px] font-medium text-primary transition-opacity active:opacity-60"
    >
        <ChevronLeft size={20} strokeWidth={2.4} />
        Configuración
    </button>
    <h1 class="truncate text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground">{title}</h1>
    {#if subtitle}
        <p class="truncate text-[13px] text-muted-foreground">{subtitle}</p>
    {/if}
</header>
