<script lang="ts" module>
    export type AccountKind = 'bank' | 'wallet'
</script>

<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'
    import { Money } from '$lib/components/premium'

    /**
     * Cuenta como tarjeta física (al estilo Wallet de Apple): superficie de color
     * profundo con brillo sutil, nombre arriba y el saldo como protagonista. El
     * color distingue el tipo (banco = azul marino, billetera = verde petróleo).
     */
    interface Props {
        kind: AccountKind
        name: string
        subtitle: string
        balance: number
        icon: IconComponent
        badge?: string | null
    }
    let { kind, name, subtitle, balance, icon: Icon, badge = null }: Props = $props()

    const GRADIENTS: Record<AccountKind, string> = {
        bank: 'linear-gradient(140deg, #0b1d45 0%, #15398c 52%, #2563eb 100%)',
        wallet: 'linear-gradient(140deg, #052e2b 0%, #0b6157 52%, #14a38f 100%)'
    }
</script>

<article
    class="relative flex aspect-[1.72] w-full flex-col justify-between overflow-hidden rounded-[24px] p-5 text-white"
    style="background:{GRADIENTS[kind]};box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 18px 36px -18px rgba(9,20,50,0.55)"
    aria-label={`${name}, saldo`}
>
    <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0"
        style="background:radial-gradient(90% 70% at 100% 0%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 60%),radial-gradient(70% 60% at 0% 100%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 70%)"
    ></div>

    <div class="relative flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2.5">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/15 ring-1 ring-white/20">
                <Icon size={18} strokeWidth={2} />
            </span>
            <span class="truncate text-[16px] font-semibold tracking-[-0.01em]">{name}</span>
        </div>
        {#if badge}
            <span class="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/20">{badge}</span>
        {/if}
    </div>

    <div class="relative">
        <p class="text-[12.5px] font-medium text-white/65">Saldo disponible</p>
        <p class="mt-1 text-[32px] font-semibold leading-none tracking-[-0.035em]">
            <Money value={balance} />
        </p>
        <p class="mt-3 truncate font-mono text-[12px] tracking-[0.06em] text-white/70">{subtitle}</p>
    </div>
</article>
