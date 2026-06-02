<script lang="ts">
    import { Building2, User } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import type { PersonType } from '$lib/api/requests/customers'

    interface Props {
        value: PersonType
        onChange: (type: PersonType) => void
    }
    let { value, onChange }: Props = $props()

    const OPTIONS: { id: PersonType; label: string; icon: IconComponent }[] = [
        { id: 'INDIVIDUAL', label: 'Persona', icon: User },
        { id: 'COMPANY', label: 'Empresa', icon: Building2 }
    ]
</script>

<div class="flex gap-1 rounded-2xl bg-secondary p-1">
    {#each OPTIONS as option (option.id)}
        {@const active = value === option.id}
        {@const Icon = option.icon}
        <button
            type="button"
            onclick={() => onChange(option.id)}
            class="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition-opacity active:opacity-80 {active
                ? 'bg-card'
                : ''}"
            style={active ? 'box-shadow:0 2px 6px hsla(222,47%,11%,0.08)' : ''}
        >
            <Icon
                size={16}
                color={active ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 55%)'}
                strokeWidth={2}
            />
            <span
                class="text-sm font-semibold {active
                    ? 'text-foreground'
                    : 'text-muted-foreground'}"
            >
                {option.label}
            </span>
        </button>
    {/each}
</div>
