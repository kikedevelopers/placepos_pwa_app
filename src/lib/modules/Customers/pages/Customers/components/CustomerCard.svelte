<script lang="ts">
    import { Building2, ChevronRight, User } from '@lucide/svelte'
    import type { Customer } from '$lib/api/requests/customers'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        customer: Customer
        onclick: () => void
    }
    let { customer, onclick }: Props = $props()

    const isCompany = $derived(customer.person_type === 'COMPANY')
    const Icon = $derived(isCompany ? Building2 : User)
    const meta = $derived(
        [customer.doc_number || 'Sin documento', customer.phone].filter(Boolean).join(' · ')
    )
</script>

<PressableScale
    as="div"
    {onclick}
    class="block w-full text-left"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div class="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div
            class="flex h-11 w-11 items-center justify-center rounded-full"
            style="background-color:{isCompany
                ? 'hsla(258, 80%, 60%, 0.12)'
                : 'hsla(217, 91%, 50%, 0.12)'}"
        >
            <Icon
                size={20}
                color={isCompany ? 'hsl(258, 80%, 60%)' : 'hsl(217, 91%, 50%)'}
                strokeWidth={2}
            />
        </div>
        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-foreground">{customer.name}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p>
            {#if customer.email}
                <p class="truncate text-[11px] text-muted-foreground/70">{customer.email}</p>
            {/if}
        </div>
        <ChevronRight size={18} color="hsl(215, 16%, 60%)" />
    </div>
</PressableScale>
