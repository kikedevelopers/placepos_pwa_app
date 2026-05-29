<script lang="ts">
    import { FileText } from '@lucide/svelte'
    import type { DailyClosure } from '$lib/api/requests/reports'
    import { formatCurrency } from '$lib/utils/numbers'
    import SectionBlock from './SectionBlock.svelte'
    import Badge from './Badge.svelte'

    interface Props {
        dc: DailyClosure
    }
    let { dc }: Props = $props()
    const s = $derived(dc.adjustmentNotesSummary)
</script>

{#if dc.adjustmentNotes.length > 0}
    <SectionBlock
        icon={FileText}
        accent="warning"
        title="Notas de ajuste"
        subtitle="Facturas de otros días — informativo"
    >
        <div class="mb-3 flex gap-2">
            <Badge label={`− ${formatCurrency(s.totalCredit)} crédito`} tone="destructive" />
            <Badge label={`+ ${formatCurrency(s.totalDebit)} débito`} tone="success" />
        </div>
        {#each dc.adjustmentNotes as note, i (`${note.noteNumber}-${i}`)}
            {@const isCredit = note.noteType === 'CREDIT'}
            <div class="border-t border-border/60 py-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-foreground">{note.noteNumber}</span>
                    <Badge
                        label={isCredit ? 'Crédito' : 'Débito'}
                        tone={isCredit ? 'destructive' : 'success'}
                    />
                </div>
                <div class="mt-1 flex items-center justify-between">
                    <span class="flex-1 truncate pr-3 text-[11px] text-muted-foreground">
                        Factura {note.originalInvoiceNumber} · {note.customerName}
                    </span>
                    <span
                        class="text-xs font-semibold {isCredit
                            ? 'text-destructive'
                            : 'text-success'}"
                    >
                        {isCredit ? '−' : '+'}
                        {formatCurrency(note.total)}
                    </span>
                </div>
            </div>
        {/each}
    </SectionBlock>
{/if}
