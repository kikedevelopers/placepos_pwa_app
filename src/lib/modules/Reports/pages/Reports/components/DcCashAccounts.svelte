<script lang="ts">
    import { Landmark } from '@lucide/svelte'
    import type { TodaySummary } from '$lib/api/requests/dashboard'
    import { formatCurrency } from '$lib/utils/numbers'
    import SectionBlock from './SectionBlock.svelte'
    import LineRow from './LineRow.svelte'
    import Badge from './Badge.svelte'

    interface Props {
        today: TodaySummary
    }
    let { today }: Props = $props()
    const ca = $derived(today.cashAccounts)

    type Item = { key: string; name: string; balance: number }

    const cashRegisterItems = $derived(
        ca.cashRegisters.map((c): Item => ({ key: `c-${c.id}`, name: c.userName, balance: c.balance }))
    )
    const bankItems = $derived(
        ca.banks.map((b): Item => ({ key: `b-${b.id}`, name: b.name, balance: b.balance }))
    )
    const walletItems = $derived(
        ca.wallets.map((w): Item => ({ key: `w-${w.id}`, name: w.name, balance: w.balance }))
    )

    const LABEL = 'text-[11px] uppercase tracking-[1px] text-muted-foreground/70 mb-1'
</script>

{#snippet group(title: string, items: Item[], subtotal: number)}
    {#if items.length > 0}
        <div class="mt-1">
            <p class={LABEL}>{title}</p>
            {#each items as item (item.key)}
                <LineRow
                    label={item.name}
                    value={formatCurrency(item.balance)}
                    tone={item.balance < 0 ? 'liability' : 'neutral'}
                />
            {/each}
            <div class="border-t border-border/60">
                <LineRow label="Subtotal" value={formatCurrency(subtotal)} tone="muted" />
            </div>
        </div>
    {/if}
{/snippet}

<SectionBlock
    icon={Landmark}
    accent="primary"
    title="Saldos de cajas, bancos y billeteras"
>
    {#snippet right()}
        <Badge label={formatCurrency(ca.totals.grand)} tone="primary" />
    {/snippet}

    {@render group('Cajas registradoras', cashRegisterItems, ca.totals.cashRegisters)}
    {@render group('Bancos', bankItems, ca.totals.banks)}
    {@render group('Billeteras', walletItems, ca.totals.wallets)}
</SectionBlock>
