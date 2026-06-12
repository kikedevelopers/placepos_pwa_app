<script lang="ts">
    import { CreditCard, HandCoins, Share2, X } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useProfile } from '$lib/hooks/useProfile'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import { chargeOrder } from '$lib/stores/chargeOrder.svelte'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { useSaleDetail } from './useSaleDetail'
    import AbonoSheet from './components/AbonoSheet.svelte'
    import { useShareTicket } from './share/useShareTicket.svelte'
    import TicketHero from './components/TicketHero.svelte'
    import TicketReceipt from './components/TicketReceipt.svelte'
    import FinancialSummary from './components/FinancialSummary.svelte'
    import TicketPayments from './components/TicketPayments.svelte'
    import TicketCreditCard from './components/TicketCreditCard.svelte'
    import TicketNoteCard from './components/TicketNoteCard.svelte'
    import ShareSheet from './components/ShareSheet.svelte'

    interface Props {
        ticketId: number | null
        onClose: () => void
    }
    let { ticketId, onClose }: Props = $props()

    const query = useSaleDetail(() => ticketId)
    const profileQuery = useProfile()
    const role = useUserRole()

    const sale = $derived($query.data)
    const company = $derived($profileQuery.data?.payload?.company_profile?.primary ?? null)
    // Igual que placepos: ganancia/margen solo owner/superadmin (o cold start).
    const canViewProfit = $derived(
        role.role == null || role.role === 'owner' || role.role === 'superadmin'
    )

    // Parallax: el hero se desvanece y "se queda atrás" al bajar; reaparece al subir.
    let scrollY = $state(0)
    let heroH = $state(200)
    const heroOpacity = $derived(Math.max(0, Math.min(1, 1 - scrollY / Math.max(heroH * 0.8, 1))))
    const heroTranslate = $derived(-Math.min(scrollY, heroH) * 0.4)

    let shareOpen = $state(false)
    let abonoOpen = $state(false)
    let receiptNode = $state<HTMLElement>()
    const { exporting, shareAsImage, shareAsPdf } = useShareTicket()

    // Acciones del ticket (paridad placepos): un ORDER se puede COBRAR; una venta
    // con crédito pendiente admite un ABONO.
    const isOrder = $derived(sale?.ticketType === 'ORDER')
    const creditBalance = $derived(sale?.credit && sale.credit.balance > 0 ? sale.credit.balance : 0)

    const handleCharge = () => {
        if (!sale) return
        chargeOrder.open({
            invoice_id: sale.id,
            total: sale.total,
            ticket_number: sale.ticketNumber,
            customer_name: sale.customerName
        })
    }

    const handleShareImage = async () => {
        await shareAsImage(receiptNode, sale!)
        shareOpen = false
    }
    const handleSharePdf = async () => {
        if (!sale) return
        await shareAsPdf(sale, company)
        shareOpen = false
    }
</script>

{#snippet closeButton()}
    <button
        type="button"
        aria-label="Cerrar"
        onclick={onClose}
        class="absolute right-4 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-transform active:scale-[0.97]"
        style="box-shadow:0 2px 6px rgba(0,0,0,0.1)"
    >
        <X size={18} color="hsl(215, 16%, 40%)" strokeWidth={2.2} />
    </button>
{/snippet}

{#if $query.isLoading || (!sale && !$query.isError)}
    <div class="relative flex h-full flex-col bg-background">
        {@render closeButton()}
        <ScreenState kind="loading" />
    </div>
{:else if $query.isError || !sale}
    <div class="relative flex h-full flex-col bg-background">
        {@render closeButton()}
        <ScreenState kind="error" message={getErrorMessage($query.error)} />
    </div>
{:else}
    <div class="relative flex h-full flex-col" style="background-color: hsl(214, 22%, 92%)">
        <!-- Hero detrás del contenido (parallax + fade atados al scroll). -->
        <div
            class="pointer-events-none absolute inset-x-0 top-0 z-0"
            style="opacity:{heroOpacity};transform:translateY({heroTranslate}px)"
            bind:clientHeight={heroH}
        >
            <TicketHero {sale} />
        </div>

        {@render closeButton()}

        <div
            class="flex-1 overflow-y-auto"
            onscroll={(e) => (scrollY = e.currentTarget.scrollTop)}
        >
            <div class="flex flex-col gap-3.5 px-4 pb-4" style="padding-top:{heroH + 14}px">
                <FadeInUp index={0}>
                    <div
                        class="overflow-hidden rounded-2xl"
                        style="box-shadow:0 12px 24px rgba(15,23,42,0.16)"
                    >
                        <TicketReceipt {sale} {company} />
                    </div>
                </FadeInUp>

                <FadeInUp index={1}>
                    <FinancialSummary {sale} {canViewProfit} />
                </FadeInUp>

                <FadeInUp index={2}>
                    <TicketPayments {sale} />
                </FadeInUp>

                {#if sale.credit}
                    <FadeInUp index={3}>
                        <TicketCreditCard credit={sale.credit} />
                    </FadeInUp>
                {/if}

                {#if sale.notes}
                    <FadeInUp index={4}>
                        <TicketNoteCard note={sale.notes} />
                    </FadeInUp>
                {/if}
            </div>
        </div>

        <!-- Footer de acciones (sin liquid glass en web). -->
        <div
            class="border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        >
            {#if isOrder}
                <PrimaryButton label="Cobrar pedido" onclick={handleCharge} icon={CreditCard} />
                <button
                    type="button"
                    onclick={() => (shareOpen = true)}
                    class="mt-2 w-full py-2 text-sm font-semibold text-muted-foreground transition-opacity active:opacity-70"
                >
                    Compartir recibo
                </button>
            {:else if creditBalance > 0}
                <PrimaryButton
                    label="Hacer un abono"
                    onclick={() => (abonoOpen = true)}
                    icon={HandCoins}
                />
                <button
                    type="button"
                    onclick={() => (shareOpen = true)}
                    class="mt-2 w-full py-2 text-sm font-semibold text-muted-foreground transition-opacity active:opacity-70"
                >
                    Compartir recibo
                </button>
            {:else}
                <PrimaryButton
                    label="Compartir recibo"
                    onclick={() => (shareOpen = true)}
                    icon={Share2}
                />
            {/if}
        </div>

        <!-- Recibo fuera de pantalla para capturar como imagen (fondo blanco, ancho fijo). -->
        <div aria-hidden="true" style="position:absolute;left:-10000px;top:0;width:380px">
            <div bind:this={receiptNode} style="background-color:#ffffff">
                <TicketReceipt {sale} {company} />
            </div>
        </div>

        <ShareSheet
            visible={shareOpen}
            {exporting}
            onClose={() => (shareOpen = false)}
            onImage={handleShareImage}
            onPdf={handleSharePdf}
        />

        {#if sale.credit && creditBalance > 0}
            <AbonoSheet
                open={abonoOpen}
                invoiceId={sale.id}
                balance={sale.credit.balance}
                onClose={() => (abonoOpen = false)}
            />
        {/if}
    </div>
{/if}
