<script lang="ts">
    import { Bot, ChevronRight } from '@lucide/svelte'

    /**
     * Acceso a la ficha del asistente desde el formulario del producto. Solo se
     * muestra con el agente de ventas habilitado y el producto ya guardado.
     */
    interface Props {
        fromPresentation?: boolean
        onclick: () => void
    }
    let { fromPresentation = false, onclick }: Props = $props()
</script>

<button
    type="button"
    {onclick}
    class="surface flex w-full items-center gap-3 px-4 py-3.5 text-left transition-transform duration-150 ease-out active:scale-[0.985]"
>
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
        <Bot size={19} strokeWidth={2.1} />
    </span>
    <span class="min-w-0 flex-1">
        <span class="block text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">Ficha para el asistente</span>
        <span class="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
            {fromPresentation
                ? 'Es la del producto base: qué es, para qué sirve y con qué se relaciona.'
                : 'Qué es, para qué sirve y con qué se relaciona. El agente la usa para vender.'}
        </span>
    </span>
    <ChevronRight size={17} class="shrink-0 text-muted-foreground/50" />
</button>
