<script lang="ts">
    import { CreditCard, Wallet } from '@lucide/svelte'
    import { ACCOUNT_TYPE, type AccountTypeValue } from '../schemas/bank.schema'

    interface Props {
        value: AccountTypeValue
        onChange: (value: AccountTypeValue) => void
        error?: string
    }
    let { value, onChange, error }: Props = $props()
</script>

<div>
    <span class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70">Tipo de cuenta</span>
    <div class="grid grid-cols-2 gap-3">
        <button
            type="button"
            onclick={() => onChange(ACCOUNT_TYPE.SAVINGS)}
            class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 {value ===
            ACCOUNT_TYPE.SAVINGS
                ? 'border-primary/50 bg-primary/10'
                : 'border-border bg-card'}"
        >
            <Wallet
                size={20}
                color={value === ACCOUNT_TYPE.SAVINGS ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 55%)'}
                strokeWidth={2}
            />
            <span>
                <span
                    class="block text-sm font-semibold {value === ACCOUNT_TYPE.SAVINGS
                        ? 'text-primary'
                        : 'text-foreground'}">Ahorro</span
                >
                <span class="text-[10px] text-muted-foreground">Cuenta de ahorros</span>
            </span>
        </button>

        <button
            type="button"
            onclick={() => onChange(ACCOUNT_TYPE.CHECKING)}
            class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 {value ===
            ACCOUNT_TYPE.CHECKING
                ? 'border-primary/50 bg-primary/10'
                : 'border-border bg-card'}"
        >
            <CreditCard
                size={20}
                color={value === ACCOUNT_TYPE.CHECKING ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 55%)'}
                strokeWidth={2}
            />
            <span>
                <span
                    class="block text-sm font-semibold {value === ACCOUNT_TYPE.CHECKING
                        ? 'text-primary'
                        : 'text-foreground'}">Corriente</span
                >
                <span class="text-[10px] text-muted-foreground">Cuenta corriente</span>
            </span>
        </button>
    </div>
    {#if error}
        <p class="ml-0.5 mt-1.5 text-xs text-destructive">{error}</p>
    {/if}
</div>
