<script lang="ts" module>
    /** Qué campo teclea el usuario; el otro se deriva. */
    export type PriceInputMode = 'price' | 'margin'
</script>

<script lang="ts">
    import { DollarSign, Percent } from '@lucide/svelte'

    interface Props {
        mode: PriceInputMode
        onChange: (mode: PriceInputMode) => void
    }
    let { mode, onChange }: Props = $props()

    const BTN =
        'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors'
</script>

<!--
    Conmuta cómo se definen TODOS los precios del producto: escribiendo el precio
    de venta (y se deriva el margen) o al revés.

    Cambiar de modo NO recalcula nada: solo cambia qué campo es editable. Es lo
    que hace fiable el margen — el valor tecleado se guarda tal cual, en vez de
    recalcularse desde un precio ya redondeado. Ver `utils/priceMath.ts`.
-->
<div
    class="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 p-0.5"
    role="group"
    aria-label="Definir los precios por"
>
    <button
        type="button"
        onclick={() => onChange('price')}
        aria-pressed={mode === 'price'}
        class="{BTN} {mode === 'price'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground'}"
    >
        <DollarSign size={12} />
        Precio
    </button>
    <button
        type="button"
        onclick={() => onChange('margin')}
        aria-pressed={mode === 'margin'}
        class="{BTN} {mode === 'margin'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground'}"
    >
        <Percent size={12} />
        Margen
    </button>
</div>
