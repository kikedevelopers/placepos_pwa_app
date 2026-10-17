<script lang="ts">
    import { Copy, Check, RotateCcw, Info } from '@lucide/svelte'
    import PlaceMark from './PlaceMark.svelte'
    import SaleCard from './SaleCard.svelte'
    import { renderMarkdown } from '$lib/modules/Place/lib/markdown'
    import { describeToolIcon } from '$lib/modules/Place/lib/tool-icons'
    import type { ChatMessage } from '$lib/modules/Place/store/chat.svelte'

    interface Props {
        message: ChatMessage
        canRetry: boolean
        onretry: () => void
    }
    let { message, canRetry, onretry }: Props = $props()

    const isUser = $derived(message.role === 'user')
    const html = $derived(message.role === 'assistant' ? renderMarkdown(message.content) : '')
    const isEmpty = $derived(message.content.trim().length === 0)
    const runningTools = $derived((message.tools ?? []).filter((t) => t.status !== 'error'))
    const cards = $derived(message.cards ?? [])

    let copied = $state(false)
    function copy() {
        navigator.clipboard
            ?.writeText(message.content)
            .then(() => {
                copied = true
                setTimeout(() => (copied = false), 1600)
            })
            .catch(() => {})
    }
</script>

{#if isUser}
    <div class="flex justify-end">
        <div
            class="max-w-[85%] rounded-[18px] rounded-br-[6px] px-3.5 py-2.5 text-[14px] leading-[1.55] text-white ring-1 ring-inset ring-white/10"
            style="background-image:linear-gradient(135deg,#1e7df0,#4f46e5);box-shadow:0 6px 18px -10px rgba(30,125,240,0.9)"
        >
            <p class="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
    </div>
{:else}
    <div class="flex gap-2.5">
        <PlaceMark size="sm" active={message.is_streaming} class="mt-0.5" />
        <div class="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            {#if runningTools.length > 0}
                <div class="flex flex-wrap gap-1.5">
                    {#each runningTools as tool (tool.name)}
                        {@const ToolIcon = describeToolIcon(tool.name)}
                        <span
                            class="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10.5px] text-muted-foreground"
                        >
                            {#if tool.status === 'running'}<span class="place-dot"></span>{:else}<ToolIcon class="size-3" aria-hidden="true" />{/if}
                            {tool.label}
                        </span>
                    {/each}
                </div>
            {/if}

            {#each cards as card, index (`${card.kind}-${index}`)}
                <SaleCard {card} />
            {/each}

            {#if message.is_error}
                <div
                    class="rounded-[18px] rounded-tl-[6px] border border-destructive/25 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-destructive"
                    style="background-color:hsla(0,84%,60%,0.06)"
                >
                    {message.content}
                </div>
            {:else if isEmpty && cards.length > 0 && !message.is_streaming}
                <!-- Solo la tarjeta: Place no escribió texto. -->
            {:else if isEmpty && message.is_streaming}
                <div class="flex items-center gap-1.5 rounded-[18px] rounded-tl-[6px] border border-border/60 bg-card/70 px-4 py-3.5 backdrop-blur-sm">
                    {#each [0, 1, 2] as d (d)}
                        <span class="place-typing" style="animation-delay:{d * 120}ms"></span>
                    {/each}
                </div>
            {:else}
                <div
                    class="place-md min-w-0 max-w-full rounded-[18px] rounded-tl-[6px] border border-border/60 bg-card/70 px-3.5 py-2.5 text-[14px] leading-[1.6] text-foreground backdrop-blur-sm"
                >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- markdown ya escapado en renderMarkdown -->
                    {@html html}{#if message.is_streaming}<span class="place-caret"></span>{/if}
                </div>
            {/if}

            {#if message.notice && !message.is_error}
                <p class="flex items-start gap-1 px-1 text-[11.5px] leading-snug text-amber-600">
                    <Info size={13} class="mt-0.5 shrink-0" />
                    {message.notice}
                </p>
            {/if}

            {#if !message.is_streaming && !isEmpty}
                <div class="flex items-center gap-1 pt-0.5">
                    {#if !message.is_error}
                        <button
                            type="button"
                            onclick={copy}
                            class="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground active:scale-95"
                        >
                            {#if copied}<Check size={13} class="text-emerald-500" />Copiado{:else}<Copy
                                    size={13}
                                />Copiar{/if}
                        </button>
                    {/if}
                    {#if canRetry}
                        <button
                            type="button"
                            onclick={onretry}
                            class="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground active:scale-95"
                        >
                            <RotateCcw size={13} />Reintentar
                        </button>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .place-dot {
        height: 5px;
        width: 5px;
        border-radius: 9999px;
        background: hsl(var(--primary));
        animation: place-bounce 1s infinite;
    }
    .place-typing {
        height: 6px;
        width: 6px;
        border-radius: 9999px;
        background: rgba(30, 125, 240, 0.6);
        animation: place-bounce 1s infinite;
    }
    .place-caret {
        display: inline-block;
        width: 7px;
        height: 14px;
        margin-left: 2px;
        transform: translateY(2px);
        border-radius: 2px;
        background: rgba(30, 125, 240, 0.7);
        animation: place-blink 1s steps(2, start) infinite;
    }
    @keyframes place-bounce {
        0%,
        100% {
            transform: translateY(0);
            opacity: 0.6;
        }
        50% {
            transform: translateY(-3px);
            opacity: 1;
        }
    }
    @keyframes place-blink {
        50% {
            opacity: 0;
        }
    }
    /* Estilos del markdown renderizado */
    .place-md :global(p) {
        margin: 0 0 0.5rem;
    }
    .place-md :global(p:last-child) {
        margin-bottom: 0;
    }
    .place-md :global(strong) {
        font-weight: 600;
    }
    .place-md :global(ul),
    .place-md :global(ol) {
        margin: 0.25rem 0 0.5rem;
        padding-left: 1.1rem;
    }
    .place-md :global(li) {
        margin: 0.15rem 0;
    }
    .place-md :global(h3),
    .place-md :global(h4) {
        font-weight: 600;
        margin: 0.4rem 0 0.3rem;
        font-size: 0.95em;
    }
    .place-md :global(code) {
        background: hsla(215, 16%, 47%, 0.14);
        border-radius: 4px;
        padding: 0.05rem 0.3rem;
        font-size: 0.85em;
    }
    .place-md :global(pre) {
        background: hsla(215, 16%, 47%, 0.12);
        border-radius: 10px;
        padding: 0.6rem 0.75rem;
        overflow-x: auto;
        margin: 0.25rem 0 0.5rem;
    }
    .place-md :global(pre code) {
        background: transparent;
        padding: 0;
    }
    .place-md :global(a) {
        color: hsl(var(--primary));
        text-decoration: underline;
    }
    .place-md :global(table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85em;
        margin: 0.25rem 0 0.5rem;
        display: block;
        overflow-x: auto;
    }
    .place-md :global(th),
    .place-md :global(td) {
        border: 1px solid hsl(var(--border));
        padding: 0.3rem 0.5rem;
        text-align: left;
        white-space: nowrap;
    }
    .place-md :global(th) {
        background: hsla(215, 16%, 47%, 0.08);
        font-weight: 600;
    }
    .place-md :global(blockquote) {
        border-left: 3px solid hsl(var(--border));
        padding-left: 0.6rem;
        color: hsl(var(--muted-foreground));
        margin: 0.25rem 0;
    }
    @media (prefers-reduced-motion: reduce) {
        .place-dot,
        .place-typing,
        .place-caret {
            animation: none;
        }
    }
</style>
