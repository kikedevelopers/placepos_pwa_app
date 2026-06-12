<script lang="ts">
    import { ChevronRight } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import PressableScale from '$lib/components/PressableScale.svelte'

    /**
     * Fila de navegación tipo "ajuste" (icono + título + subtítulo + chevron).
     * Patrón de lista estilo iOS Settings para el home de Configuración.
     */
    interface Props {
        icon: IconComponent
        label: string
        subtitle?: string
        onclick: () => void
        /** Tono del cuadro de icono. */
        tone?: 'primary' | 'success' | 'warning' | 'muted'
    }
    let { icon: Icon, label, subtitle, onclick, tone = 'primary' }: Props = $props()

    const TONES = {
        primary: { bg: 'hsla(217, 91%, 50%, 0.12)', fg: 'hsl(217, 91%, 50%)' },
        success: { bg: 'hsla(158, 64%, 38%, 0.12)', fg: 'hsl(158, 64%, 40%)' },
        warning: { bg: 'hsla(32, 95%, 44%, 0.12)', fg: 'hsl(32, 95%, 44%)' },
        muted: { bg: 'hsla(215, 16%, 47%, 0.10)', fg: 'hsl(215, 16%, 47%)' }
    } as const
    const c = $derived(TONES[tone])
</script>

<PressableScale {onclick} class="block w-full" ariaLabel={label}>
    <span class="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
        <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style="background-color:{c.bg}"
        >
            <Icon size={19} color={c.fg} strokeWidth={2} />
        </span>
        <span class="flex min-w-0 flex-1 flex-col text-left">
            <span class="truncate text-sm font-semibold text-foreground">{label}</span>
            {#if subtitle}
                <span class="truncate text-[11px] text-muted-foreground">{subtitle}</span>
            {/if}
        </span>
        <ChevronRight size={18} color="hsl(215, 16%, 60%)" strokeWidth={2} />
    </span>
</PressableScale>
