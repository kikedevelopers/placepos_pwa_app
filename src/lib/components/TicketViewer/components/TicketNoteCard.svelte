<script lang="ts">
    import { StickyNote } from '@lucide/svelte'
    import CollapsibleSection from './CollapsibleSection.svelte'

    interface Props {
        note: string
    }
    let { note }: Props = $props()
</script>

<CollapsibleSection
    title="Nota del pedido"
    subtitle={note}
    icon={StickyNote}
    iconColor="hsl(32, 95%, 40%)"
    iconBg="hsla(32, 95%, 44%, 0.14)"
>
    <div class="pt-1">
        <p class="text-sm leading-relaxed text-foreground">{note}</p>
    </div>
</CollapsibleSection>
