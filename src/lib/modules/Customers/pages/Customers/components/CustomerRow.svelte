<script lang="ts">
    import { Building2 } from '@lucide/svelte'
    import type { Customer } from '$lib/api/requests/customers'
    import { initials } from '$lib/modules/Reports/pages/Reports/utils/creditRow'

    interface Props {
        customer: Customer
        onclick?: () => void
    }
    let { customer, onclick }: Props = $props()

    const isCompany = $derived(customer.person_type === 'COMPANY')
    const detail = $derived(
        [customer.category?.name, customer.doc_number, customer.phone].filter(Boolean).join(' · ') || 'Sin documento'
    )
</script>

<button
    type="button"
    {onclick}
    disabled={!onclick}
    aria-label={customer.name}
    class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05] disabled:active:bg-transparent"
>
    <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold {isCompany
            ? 'bg-primary/10 text-primary'
            : 'bg-foreground/[0.06] text-foreground/75'}"
        aria-hidden="true"
    >
        {#if isCompany}<Building2 size={17} strokeWidth={2.1} />{:else}{initials(customer.name)}{/if}
    </span>
    <span class="min-w-0 flex-1">
        <span class="block truncate text-[15px] font-medium text-foreground">{customer.name}</span>
        <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">{detail}</span>
    </span>
</button>
