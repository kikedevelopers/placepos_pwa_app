<script lang="ts">
    interface Props {
        title: string
        action?: string
    }
    let { title, action }: Props = $props()
</script>

<div class="mb-3 flex items-center justify-between">
    <h2 class="text-base font-semibold tracking-[-0.2px] text-foreground">{title}</h2>
    {#if action}
        <span class="text-xs font-medium text-primary">{action}</span>
    {/if}
</div>
