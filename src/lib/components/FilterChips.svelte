<script lang="ts">
    type Option = { id: string; label: string }

    interface Props {
        options: readonly Option[]
        value: string
        onChange: (value: string) => void
    }
    let { options, value, onChange }: Props = $props()
</script>

<div class="flex flex-wrap gap-2">
    {#each options as option (option.id)}
        {@const active = option.id === value}
        <button
            type="button"
            onclick={() => onChange(option.id)}
            class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-opacity active:opacity-80 {active
                ? 'border-transparent text-white'
                : 'border-border bg-card text-muted-foreground'}"
            style={active ? 'background-color: hsl(217, 91%, 50%)' : ''}
        >
            {option.label}
        </button>
    {/each}
</div>
