<script lang="ts">
    interface Props {
        label: string
        description?: string
        value: boolean
        onValueChange: (value: boolean) => void
    }
    let { label, description, value, onValueChange }: Props = $props()
</script>

<div class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
    <div class="flex-1 pr-3">
        <p class="text-sm font-medium text-foreground">{label}</p>
        {#if description}
            <p class="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
        {/if}
    </div>
    <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onclick={() => onValueChange(!value)}
        class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out-strong"
        style="background-color:{value ? 'hsl(217, 91%, 50%)' : 'hsl(214, 32%, 85%)'}"
    >
        <span
            class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out-strong"
            style="transform:translateX({value ? '22px' : '2px'})"
        ></span>
    </button>
</div>
