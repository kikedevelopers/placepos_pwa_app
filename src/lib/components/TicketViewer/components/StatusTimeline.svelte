<script lang="ts">
    import { CalendarClock, User } from '@lucide/svelte'
    import type { SaleStatusEvent } from '$lib/api/requests/sales'
    import { formatDateTime } from '$lib/utils/dates'
    import {
        getTimelineDescriptor,
        formatTimelineLabel,
        prepareTimeline,
        TIMELINE_TONE_COLORS
    } from '../utils/statusTimeline'
    import CollapsibleSection from './CollapsibleSection.svelte'

    interface Props {
        history?: SaleStatusEvent[] | null
    }
    let { history }: Props = $props()

    const events = $derived(prepareTimeline(history))
    const count = $derived(events.length)
</script>

{#if count > 0}
    <CollapsibleSection
        title="Línea de tiempo"
        subtitle={count === 1 ? '1 estado registrado' : `${count} estados registrados`}
        icon={CalendarClock}
        iconColor="hsl(199, 89%, 42%)"
        iconBg="hsla(199, 89%, 48%, 0.12)"
    >
        {#snippet trailing()}
            <span
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style="background-color:hsla(199,89%,48%,0.12);color:hsl(199,89%,38%)">{count}</span
            >
        {/snippet}

        <ol class="pt-2">
            {#each events as event, i (`${event.eventType}-${event.createdAt}-${i}`)}
                {@const desc = getTimelineDescriptor(event.eventType)}
                {@const color = TIMELINE_TONE_COLORS[desc.tone]}
                {@const isLast = i === events.length - 1}
                <li class="relative flex gap-3 {isLast ? 'pb-0' : 'pb-4'}">
                    <!-- Línea vertical que conecta los puntos, salvo el último. -->
                    {#if !isLast}
                        <span
                            aria-hidden="true"
                            class="absolute left-4 top-8 w-px"
                            style="bottom:0;background-color:hsla(215,16%,47%,0.2)"
                        ></span>
                    {/if}
                    <span
                        class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style="background-color:{color.bg}"
                    >
                        <desc.icon size={15} color={color.fg} strokeWidth={2.2} />
                    </span>
                    <div class="min-w-0 flex-1 pt-0.5">
                        <p class="text-sm font-medium text-foreground">
                            {formatTimelineLabel(event)}
                        </p>
                        <p
                            class="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground/80"
                        >
                            <span>{formatDateTime(event.createdAt)}</span>
                            {#if event.createdBy}
                                <span class="text-muted-foreground/40">·</span>
                                <span class="inline-flex items-center gap-1">
                                    <User size={10} color="hsl(215, 16%, 55%)" />
                                    {event.createdBy}
                                </span>
                            {/if}
                        </p>
                    </div>
                </li>
            {/each}
        </ol>
    </CollapsibleSection>
{/if}
