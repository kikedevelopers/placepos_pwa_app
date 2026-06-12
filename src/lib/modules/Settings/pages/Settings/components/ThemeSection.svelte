<script lang="ts">
    import { Check, Moon, Sun } from '@lucide/svelte'
    import { theme, type ThemeMode } from '$lib/stores/theme.svelte'
    import SectionHeader from './SectionHeader.svelte'

    let { onBack }: { onBack: () => void } = $props()

    const OPTIONS: {
        value: ThemeMode
        label: string
        description: string
        icon: typeof Sun
    }[] = [
        {
            value: 'light',
            label: 'Claro',
            description: 'Fondo blanco con texto oscuro. Recomendado para entornos iluminados.',
            icon: Sun
        },
        {
            value: 'dark',
            label: 'Oscuro',
            description: 'Fondo oscuro con texto claro. Reduce la fatiga visual en jornadas largas.',
            icon: Moon
        }
    ]
</script>

<SectionHeader title="Tema" subtitle="Apariencia de la aplicación" {onBack} />

<div class="px-5 pb-8">
    <p class="mb-4 text-sm text-muted-foreground">
        Selecciona el modo de color que prefieras para toda la aplicación.
    </p>

    <div class="grid grid-cols-2 gap-3">
        {#each OPTIONS as opt (opt.value)}
            {@const active = theme.mode === opt.value}
            <button
                type="button"
                onclick={() => theme.setMode(opt.value)}
                class="relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors duration-150 {active
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card'}"
            >
                <span class="flex items-center justify-between">
                    <span
                        class="flex h-10 w-10 items-center justify-center rounded-xl"
                        style="background-color:hsla(217,91%,50%,0.12)"
                    >
                        <opt.icon
                            size={20}
                            color={active ? 'hsl(217, 91%, 50%)' : 'hsl(215, 16%, 55%)'}
                            strokeWidth={2}
                        />
                    </span>
                    {#if active}
                        <span
                            class="flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                        >
                            <Check size={14} color="white" strokeWidth={3} />
                        </span>
                    {/if}
                </span>

                <!-- Preview visual del tema -->
                <span
                    class="flex flex-col gap-1.5 rounded-xl p-2.5"
                    style={opt.value === 'dark'
                        ? 'background:hsl(222,47%,8%)'
                        : 'background:hsl(210,40%,96%);border:1px solid hsl(214,32%,89%)'}
                >
                    <span
                        class="h-2 w-10 rounded-full"
                        style="background:hsl(217,91%,55%)"
                    ></span>
                    <span
                        class="h-1.5 w-full rounded-full"
                        style={opt.value === 'dark'
                            ? 'background:hsl(217,33%,22%)'
                            : 'background:hsl(214,32%,85%)'}
                    ></span>
                    <span
                        class="h-1.5 w-2/3 rounded-full"
                        style={opt.value === 'dark'
                            ? 'background:hsl(217,33%,22%)'
                            : 'background:hsl(214,32%,85%)'}
                    ></span>
                </span>

                <span>
                    <span
                        class="block text-sm font-semibold {active
                            ? 'text-primary'
                            : 'text-foreground'}">{opt.label}</span
                    >
                    <span class="mt-0.5 block text-[11px] leading-snug text-muted-foreground"
                        >{opt.description}</span
                    >
                </span>
            </button>
        {/each}
    </div>
</div>
