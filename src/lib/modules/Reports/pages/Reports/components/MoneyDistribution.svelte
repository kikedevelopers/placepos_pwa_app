<script lang="ts">
    import { Money, barLayout, shortMoney } from '$lib/components/premium'

    /**
     * "¿Dónde está el dinero?" (espejo de placepos): recogido en efectivo, en
     * consignación y lo dado a crédito. Paleta validada de placepos: verde =
     * efectivo, azul = consignación, ámbar = crédito.
     */
    interface Props {
        cash: number
        consign: number
        credit: number
    }
    let { cash, consign, credit }: Props = $props()

    const W = 300
    const H = 110
    const items = $derived([
        { key: 'cash', label: 'Efectivo', value: cash, color: '#27b07d' },
        { key: 'consign', label: 'Consignación', value: consign, color: '#2474f5' },
        { key: 'credit', label: 'Crédito', value: credit, color: '#f98806' }
    ])
    const bars = $derived(barLayout(items.map((i) => i.value), W, H, 28))
</script>

<div class="surface px-5 pb-4 pt-[18px]">
    <p class="text-[15px] font-semibold tracking-[-0.01em] text-foreground">¿Dónde está el dinero?</p>
    <p class="mt-0.5 text-[12.5px] text-muted-foreground">Recogido en efectivo y consignación, y lo dado a crédito</p>

    <svg viewBox="0 -18 {W} {H + 18}" class="mt-4 w-full" role="img" aria-label="Distribución del dinero del día">
        <line x1="0" x2={W} y1={H} y2={H} stroke="hsl(var(--border))" stroke-width="1" />
        {#each bars as bar, i (items[i].key)}
            <rect x={bar.x} y={bar.y} width={bar.width} height={Math.max(bar.height, 2)} rx="8" fill={items[i].color} opacity={items[i].value > 0 ? 1 : 0.25} />
            <text x={bar.x + bar.width / 2} y={bar.y - 6} text-anchor="middle" font-size="11" font-weight="600" fill="hsl(var(--foreground))">{shortMoney(items[i].value)}</text>
        {/each}
    </svg>

    <dl class="mt-3 grid grid-cols-3 gap-2">
        {#each items as item (item.key)}
            <div class="min-w-0">
                <dt class="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span class="h-2 w-2 shrink-0 rounded-full" style="background:{item.color}"></span>
                    <span class="truncate">{item.label}</span>
                </dt>
                <dd class="mt-0.5 truncate text-[13.5px] font-semibold text-foreground"><Money value={item.value} /></dd>
            </div>
        {/each}
    </dl>
</div>
