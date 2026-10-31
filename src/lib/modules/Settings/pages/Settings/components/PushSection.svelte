<script lang="ts">
    import { BellRing, Bot, ReceiptText } from '@lucide/svelte'
    import PushCard from '$lib/modules/Notifications/components/PushCard.svelte'
    import SectionHeader from './SectionHeader.svelte'

    /** Avisos push de ESTE dispositivo (celular o tablet). */
    let { onBack }: { onBack: () => void } = $props()
</script>

<SectionHeader title="Avisos" subtitle="Notificaciones en este dispositivo" {onBack} />

<div class="flex flex-col gap-5 px-5 pb-8">
    <PushCard persistent class="surface" />

    <section class="surface group-rows overflow-hidden" aria-label="Qué te avisamos">
        <div class="row flex items-start gap-3 px-4 py-3.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <Bot size={16} strokeWidth={2.1} />
            </span>
            <div class="min-w-0">
                <p class="text-[14.5px] font-medium text-foreground">Pedidos del agente</p>
                <p class="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                    Cuando llega uno nuevo, el cliente lo cambia, lo cancela o pide algo. Si eres dueño, también los de tus sucursales.
                </p>
            </div>
        </div>
        <div class="row flex items-start gap-3 px-4 py-3.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <ReceiptText size={16} strokeWidth={2.1} />
            </span>
            <div class="min-w-0">
                <p class="text-[14.5px] font-medium text-foreground">En la campana</p>
                <p class="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                    Todo lo demás (gastos fijos, clientes inactivos) llega a la campana de la app.
                </p>
            </div>
        </div>
    </section>

    <p class="flex items-start gap-2 px-1 text-[12.5px] leading-snug text-muted-foreground">
        <BellRing size={14} strokeWidth={2.1} class="mt-0.5 shrink-0" />
        Los avisos son por dispositivo: actívalos en cada celular o tablet donde quieras recibirlos.
    </p>
</div>
