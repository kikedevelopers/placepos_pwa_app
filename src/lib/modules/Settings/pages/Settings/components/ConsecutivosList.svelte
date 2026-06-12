<script lang="ts">
    import {
        AlertTriangle,
        Check,
        FileMinus,
        FilePlus,
        HandCoins,
        Package,
        Pencil,
        Receipt,
        ShoppingCart,
        X
    } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import type { TicketSetting, TicketSettingType } from '$lib/api/requests/ticketSettings'
    import { getErrorMessage } from '$lib/utils/errors'
    import Spinner from '$lib/components/Spinner.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { prefixSchema } from '../schemas/business'
    import { useTicketSettings, useUpdateTicketSetting } from '../hooks/useTicketSettings'

    const query = useTicketSettings()
    const update = useUpdateTicketSetting()

    const META: Record<TicketSettingType, { label: string; icon: IconComponent }> = {
        SALE: { label: 'Ventas', icon: Receipt },
        ORDER: { label: 'Pedidos', icon: ShoppingCart },
        CREDIT_NOTE: { label: 'Notas crédito', icon: FileMinus },
        DEBIT_NOTE: { label: 'Notas débito', icon: FilePlus },
        PURCHASE: { label: 'Compras', icon: Package },
        PURCHASE_PAYMENT: { label: 'Abonos a compras', icon: HandCoins }
    }

    const settings = $derived($query.data ?? [])

    // pos_api no devuelve `next_preview`: lo construimos en cliente.
    const nextPreview = (s: TicketSetting) => `${s.prefix ?? ''}${s.current_number + 1}`

    let editingId = $state<number | null>(null)
    let draft = $state('')
    let draftError = $state('')

    const startEdit = (s: TicketSetting) => {
        editingId = s.id
        draft = s.prefix ?? ''
        draftError = ''
    }
    const cancel = () => {
        editingId = null
        draft = ''
        draftError = ''
    }

    const save = (s: TicketSetting) => {
        draftError = ''
        const parsed = prefixSchema.safeParse(draft)
        if (!parsed.success) {
            draftError = parsed.error.issues[0]?.message ?? 'Prefijo inválido'
            return
        }
        // Si no cambió, salir sin llamar API.
        if (parsed.data === (s.prefix ?? '')) {
            cancel()
            return
        }
        $update.mutate(
            { id: s.id, payload: { prefix: parsed.data } },
            {
                onSuccess: cancel,
                onError: (e) =>
                    (draftError = getErrorMessage(e) ?? 'No se pudo actualizar el prefijo.')
            }
        )
    }
</script>

<div class="flex flex-col gap-4">
    <!-- Aviso -->
    <div
        class="flex items-start gap-2 rounded-xl px-3 py-2.5"
        style="background-color:hsla(32,95%,44%,0.10);border:1px solid hsla(32,95%,44%,0.28)"
    >
        <AlertTriangle size={15} color="hsl(32, 95%, 44%)" />
        <span class="flex-1 text-[11px] leading-4 text-foreground/80">
            Cambiar el prefijo solo afecta a los próximos consecutivos. Los documentos ya emitidos
            conservan su número original.
        </span>
    </div>

    {#if $query.isLoading}
        <ScreenState kind="loading" />
    {:else if $query.isError}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    {:else if settings.length === 0}
        <ScreenState kind="empty" message="No hay consecutivos configurados todavía." />
    {:else}
        <div class="flex flex-col gap-2.5">
            {#each settings as s (s.id)}
                {@const meta = META[s.ticket_type]}
                {@const editing = editingId === s.id}
                {@const saving = $update.isPending && $update.variables?.id === s.id}
                <div class="rounded-2xl border border-border bg-card p-3.5">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style="background-color:hsla(217,91%,50%,0.12)"
                        >
                            <meta.icon size={17} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                        </span>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-semibold text-foreground">{meta?.label ?? s.ticket_type}</p>
                            <p class="text-[11px] text-muted-foreground">
                                Último: {s.current_number} · Próximo:
                                <span class="font-mono">{nextPreview(s)}</span>
                            </p>
                        </div>
                        {#if !editing}
                            <span
                                class="shrink-0 rounded-lg bg-secondary px-2 py-1 font-mono text-xs font-semibold text-foreground"
                                >{s.prefix ?? '—'}</span
                            >
                            <button
                                type="button"
                                onclick={() => startEdit(s)}
                                aria-label="Editar prefijo"
                                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:opacity-60"
                            >
                                <Pencil size={16} strokeWidth={2} />
                            </button>
                        {/if}
                    </div>

                    {#if editing}
                        <div class="mt-3 flex items-center gap-2">
                            <input
                                bind:value={draft}
                                spellcheck="false"
                                autocomplete="off"
                                autocapitalize="characters"
                                placeholder="PREFIJO"
                                class="h-11 flex-1 rounded-[12px] px-3 font-mono text-base uppercase text-foreground outline-none"
                                style="border:1.5px solid {draftError
                                    ? 'hsl(0,84%,55%)'
                                    : 'hsl(217,91%,50%)'};background-color:hsla(0,0%,100%,0.7)"
                            />
                            <button
                                type="button"
                                onclick={() => save(s)}
                                disabled={saving}
                                aria-label="Guardar"
                                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary text-white active:opacity-80 disabled:opacity-60"
                            >
                                {#if saving}
                                    <Spinner size={16} color="white" />
                                {:else}
                                    <Check size={18} strokeWidth={2.6} />
                                {/if}
                            </button>
                            <button
                                type="button"
                                onclick={cancel}
                                disabled={saving}
                                aria-label="Cancelar"
                                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-border text-muted-foreground active:opacity-60 disabled:opacity-60"
                            >
                                <X size={18} strokeWidth={2.4} />
                            </button>
                        </div>
                        {#if draftError}
                            <p class="mt-1.5 ml-0.5 text-xs text-destructive">{draftError}</p>
                        {/if}
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>
