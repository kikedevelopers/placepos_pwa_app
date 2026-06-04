<script lang="ts">
    import { ShoppingCart } from '@lucide/svelte'

    interface Props {
        checked: boolean
        onChange: (checked: boolean) => void
    }
    let { checked, onChange }: Props = $props()
</script>

<button
    type="button"
    role="switch"
    aria-checked={checked}
    onclick={() => onChange(!checked)}
    class="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-150 {checked
        ? 'border-success/40 bg-success/5'
        : 'border-border bg-card'}"
>
    <span class="flex items-center gap-3">
        <ShoppingCart
            size={20}
            color={checked ? 'hsl(158, 64%, 42%)' : 'hsl(215, 16%, 55%)'}
            strokeWidth={2}
        />
        <span>
            <span
                class="block text-sm font-semibold {checked ? 'text-success' : 'text-foreground'}"
                >Disponible en POS</span
            >
            <span class="text-[10px] text-muted-foreground">
                Habilitar como método de cobro en ventas
            </span>
        </span>
    </span>

    <span
        class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 {checked
            ? 'bg-success'
            : 'bg-border'}"
    >
        <span
            class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 {checked
                ? 'left-[22px]'
                : 'left-0.5'}"
        ></span>
    </span>
</button>
