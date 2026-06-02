<script lang="ts">
    import { ChevronDown, Landmark, Lock, Monitor, Wallet } from '@lucide/svelte'
    import type {
        ExpenseSourceType,
        PaymentMethodsResponse
    } from '$lib/api/requests/expenses'
    import { formatCurrency } from '$lib/utils/numbers'
    import { buildSourceKey } from '../../schemas/expense.schema'

    interface Props {
        methods: PaymentMethodsResponse | undefined
        value: string
        onSelect: (key: string) => void
        error?: string
    }
    let { methods, value, onSelect, error }: Props = $props()

    type FlatMethod = {
        key: string
        type: ExpenseSourceType
        name: string
        balance: number
    }

    const ICONS: Record<ExpenseSourceType, typeof Wallet> = {
        wallet: Wallet,
        bank: Landmark,
        cash_register: Monitor
    }

    const SECTIONS: { type: ExpenseSourceType; label: string }[] = [
        { type: 'wallet', label: 'Billeteras' },
        { type: 'bank', label: 'Bancos' },
        { type: 'cash_register', label: 'Cajas' }
    ]

    // La caja NO trae `name`: se etiqueta como "Caja". Se aplanan todas las
    // fuentes a un arreglo con `key` ("<type>-<id>") para selección y lookup.
    const flat = $derived.by<FlatMethod[]>(() => {
        if (!methods) return []
        return [
            ...methods.wallets.map((w) => ({
                key: buildSourceKey('wallet', w.id),
                type: 'wallet' as const,
                name: w.name,
                balance: w.balance
            })),
            ...methods.banks.map((b) => ({
                key: buildSourceKey('bank', b.id),
                type: 'bank' as const,
                name: b.name,
                balance: b.balance
            })),
            ...methods.cash_registers.map((cr) => ({
                key: buildSourceKey('cash_register', cr.id),
                type: 'cash_register' as const,
                name: 'Caja',
                balance: cr.balance
            }))
        ]
    })

    const selected = $derived(flat.find((m) => m.key === value))

    let open = $state(false)

    const BORDER = 'hsla(214, 32%, 89%, 0.9)'
    const FOCUS = 'hsl(217, 91%, 50%)'
    const ERROR = 'hsl(0, 84%, 55%)'
    const borderColor = $derived(error ? ERROR : open ? FOCUS : BORDER)

    const choose = (m: FlatMethod) => {
        if (m.balance <= 0) return
        onSelect(m.key)
        open = false
    }
</script>

<div>
    <span class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
        >Medio de pago</span
    >

    <button
        type="button"
        onclick={() => (open = !open)}
        class="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left transition-colors"
        style="border:1.5px solid {borderColor};background-color:hsla(0,0%,100%,0.7)"
    >
        {#if selected}
            {@const Icon = ICONS[selected.type]}
            <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style="background-color:hsla(217, 91%, 50%, 0.12)"
            >
                <Icon size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </div>
            <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-foreground">{selected.name}</p>
                <p class="mt-0.5 text-[11px] text-muted-foreground">
                    Disponible: <span
                        class="font-semibold tabular-nums"
                        style="color:hsl(158, 64%, 38%)">{formatCurrency(selected.balance)}</span
                    >
                </p>
            </div>
        {:else}
            <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted"
            >
                <Wallet size={18} color="hsl(215, 16%, 55%)" strokeWidth={2} />
            </div>
            <span class="flex-1 text-sm text-muted-foreground">Seleccionar medio de pago…</span>
        {/if}
        <ChevronDown
            size={18}
            color="hsl(215, 16%, 55%)"
            class="shrink-0 transition-transform duration-200 {open ? 'rotate-180' : ''}"
        />
    </button>

    {#if open}
        <div
            class="mt-2 overflow-hidden rounded-2xl border border-border bg-card motion-safe:animate-slide-up"
            style="box-shadow:0 12px 28px hsla(222,47%,11%,0.12)"
        >
            <div class="max-h-[320px] overflow-y-auto py-1.5">
                {#each SECTIONS as section (section.type)}
                    {@const items = flat.filter((m) => m.type === section.type)}
                    {#if items.length > 0}
                        <div
                            class="flex items-center gap-2 border-b border-border/40 px-4 py-2"
                        >
                            <span
                                class="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70"
                                >{section.label}</span
                            >
                        </div>
                        {#each items as m (m.key)}
                            {@const Icon = ICONS[m.type]}
                            {@const disabled = m.balance <= 0}
                            {@const isSelected = m.key === value}
                            <button
                                type="button"
                                {disabled}
                                onclick={() => choose(m)}
                                class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-accent/60 {disabled
                                    ? 'opacity-50'
                                    : isSelected
                                      ? 'bg-primary/[0.06]'
                                      : ''}"
                            >
                                <div
                                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                    style="background-color:{disabled
                                        ? 'hsla(215, 16%, 55%, 0.12)'
                                        : isSelected
                                          ? 'hsla(217, 91%, 50%, 0.16)'
                                          : 'hsla(215, 16%, 55%, 0.10)'}"
                                >
                                    {#if disabled}
                                        <Lock size={16} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                                    {:else}
                                        <Icon
                                            size={18}
                                            color={isSelected
                                                ? 'hsl(217, 91%, 50%)'
                                                : 'hsl(215, 16%, 47%)'}
                                            strokeWidth={2}
                                        />
                                    {/if}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="truncate text-sm font-medium {disabled
                                            ? 'text-muted-foreground'
                                            : 'text-foreground'}"
                                    >
                                        {m.name}
                                    </p>
                                </div>
                                <div class="shrink-0 text-right">
                                    <p
                                        class="text-sm font-bold tabular-nums"
                                        style="color:{disabled
                                            ? 'hsl(215, 16%, 55%)'
                                            : 'hsl(158, 64%, 38%)'}"
                                    >
                                        {formatCurrency(m.balance)}
                                    </p>
                                    {#if disabled}
                                        <p class="text-[10px] font-medium text-muted-foreground/60">
                                            Sin fondos
                                        </p>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    {/if}
                {/each}

                {#if flat.length === 0}
                    <p class="px-4 py-6 text-center text-xs text-muted-foreground">
                        No hay medios de pago disponibles.
                    </p>
                {/if}
            </div>
        </div>
    {/if}

    {#if error}
        <p class="mt-1.5 ml-0.5 text-xs text-destructive">{error}</p>
    {/if}
</div>
