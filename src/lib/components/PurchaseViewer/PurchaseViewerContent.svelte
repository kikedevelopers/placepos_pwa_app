<script lang="ts">
    import { HandCoins, PackageCheck, Share2, X } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useProfile } from '$lib/hooks/useProfile'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import ShareSheet from '$lib/components/TicketViewer/components/ShareSheet.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { usePurchaseDetail } from './usePurchaseDetail'
    import { usePurchaseShare } from './share/usePurchaseShare.svelte'
    import { purchaseBalance } from './utils/purchaseSummary'
    import PurchaseHero from './components/PurchaseHero.svelte'
    import PurchaseReceipt from './components/PurchaseReceipt.svelte'
    import PurchaseFinancialSummary from './components/PurchaseFinancialSummary.svelte'
    import PurchaseDeliverySection from './components/PurchaseDeliverySection.svelte'
    import PurchasePaymentsHistory from './components/PurchasePaymentsHistory.svelte'
    import PurchaseTransportSection from './components/PurchaseTransportSection.svelte'
    import AbonoPurchaseSheet from './components/AbonoPurchaseSheet.svelte'
    import ReceivePurchaseSheet from './components/ReceivePurchaseSheet.svelte'

    interface Props {
        purchaseId: number | null
        onClose: () => void
    }
    let { purchaseId, onClose }: Props = $props()

    const query = usePurchaseDetail(() => purchaseId)
    const profileQuery = useProfile()

    const purchase = $derived($query.data)
    const company = $derived($profileQuery.data?.payload?.company_profile?.primary ?? null)

    const balance = $derived(purchase ? purchaseBalance(purchase.credit) : 0)
    const isPending = $derived(purchase?.status === 'PENDING')
    const hasTransport = $derived(
        !!purchase && (!!purchase.carrier || (purchase.transport_cost ?? 0) > 0)
    )

    // Parallax: el hero se desvanece y "se queda atrás" al bajar.
    let scrollY = $state(0)
    let heroH = $state(200)
    const heroOpacity = $derived(Math.max(0, Math.min(1, 1 - scrollY / Math.max(heroH * 0.8, 1))))
    const heroTranslate = $derived(-Math.min(scrollY, heroH) * 0.4)

    let shareOpen = $state(false)
    let abonoOpen = $state(false)
    let receiveOpen = $state(false)
    let receiptNode = $state<HTMLElement>()
    const { exporting, shareAsImage, shareAsPdf } = usePurchaseShare()

    const handleShareImage = async () => {
        await shareAsImage(receiptNode, purchase!)
        shareOpen = false
    }
    const handleSharePdf = async () => {
        if (!purchase) return
        await shareAsPdf(purchase, company)
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

{#snippet actionButton(
    label: string,
    icon: IconComponent,
    gradient: string,
    shadow: string,
    onclick: () => void
)}
    {@const Icon = icon}
    <PressableScale {onclick} class="block w-full rounded-[14px]" style="box-shadow:{shadow}">
        <span
            class="flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-semibold tracking-[0.2px] text-white"
            style="background:{gradient}"
        >
            <Icon size={18} color="white" strokeWidth={2.4} />
            <span class="ml-2">{label}</span>
        </span>
    </PressableScale>
{/snippet}

{#if $query.isLoading || (!purchase && !$query.isError)}
    <div class="relative flex h-full flex-col bg-background">
        {@render closeButton()}
        <ScreenState kind="loading" />
    </div>
{:else if $query.isError || !purchase}
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
            <PurchaseHero {purchase} />
        </div>

        {@render closeButton()}

        <div class="flex-1 overflow-y-auto" onscroll={(e) => (scrollY = e.currentTarget.scrollTop)}>
            <div class="flex flex-col gap-3.5 px-4 pb-4" style="padding-top:{heroH + 14}px">
                <FadeInUp index={0}>
                    <div
                        class="overflow-hidden rounded-2xl"
                        style="box-shadow:0 12px 24px rgba(15,23,42,0.16)"
                    >
                        <PurchaseReceipt {purchase} {company} />
                    </div>
                </FadeInUp>

                <FadeInUp index={1}>
                    <PurchaseFinancialSummary {purchase} />
                </FadeInUp>

                <FadeInUp index={2}>
                    <PurchaseDeliverySection {purchase} />
                </FadeInUp>

                <FadeInUp index={3}>
                    <PurchasePaymentsHistory {purchase} />
                </FadeInUp>

                {#if hasTransport}
                    <FadeInUp index={4}>
                        <PurchaseTransportSection {purchase} />
                    </FadeInUp>
                {/if}
            </div>
        </div>

        <!-- Footer de acciones. -->
        <div
            class="flex flex-col gap-2 border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        >
            {#if isPending}
                {@render actionButton(
                    'Marcar como recibida',
                    PackageCheck,
                    'linear-gradient(135deg,hsl(158,64%,44%),hsl(158,64%,38%))',
                    '0 8px 16px hsla(158,64%,38%,0.32)',
                    () => (receiveOpen = true)
                )}
            {/if}

            {#if balance > 0}
                {@render actionButton(
                    `Abonar · Pendiente ${formatCurrency(balance)}`,
                    HandCoins,
                    'linear-gradient(135deg,hsl(258,70%,60%),hsl(258,70%,52%))',
                    '0 8px 16px hsla(258,70%,56%,0.32)',
                    () => (abonoOpen = true)
                )}
            {/if}

            {#if isPending || balance > 0}
                <button
                    type="button"
                    onclick={() => (shareOpen = true)}
                    class="w-full py-2 text-sm font-semibold text-muted-foreground transition-opacity active:opacity-70"
                >
                    Compartir comprobante
                </button>
            {:else}
                <PrimaryButton
                    label="Compartir comprobante"
                    onclick={() => (shareOpen = true)}
                    icon={Share2}
                />
            {/if}
        </div>

        <!-- Recibo fuera de pantalla para capturar como imagen (fondo blanco, ancho fijo). -->
        <div aria-hidden="true" style="position:absolute;left:-10000px;top:0;width:380px">
            <div bind:this={receiptNode} style="background-color:#ffffff">
                <PurchaseReceipt {purchase} {company} />
            </div>
        </div>

        <ShareSheet
            visible={shareOpen}
            {exporting}
            title="Compartir comprobante"
            subtitle="Elige cómo quieres compartir o guardar este comprobante de compra."
            onClose={() => (shareOpen = false)}
            onImage={handleShareImage}
            onPdf={handleSharePdf}
        />

        {#if balance > 0}
            <AbonoPurchaseSheet
                open={abonoOpen}
                purchaseId={purchase.id}
                {balance}
                onClose={() => (abonoOpen = false)}
            />
        {/if}

        {#if isPending}
            <ReceivePurchaseSheet
                open={receiveOpen}
                purchaseId={purchase.id}
                defaultReceiver={purchase.created_by}
                onClose={() => (receiveOpen = false)}
            />
        {/if}
    </div>
{/if}
