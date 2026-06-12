<script lang="ts">
    import { Check, ChevronsUpDown } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'

    export type SelectOption = {
        value: string
        label: string
        description?: string
        icon?: IconComponent
        disabled?: boolean
    }

    interface Props {
        value: string | null
        options: readonly SelectOption[]
        onChange: (value: string) => void
        label?: string
        placeholder?: string
        sheetTitle?: string
    }
    let {
        value,
        options,
        onChange,
        label,
        placeholder = 'Seleccionar',
        sheetTitle
    }: Props = $props()

    let open = $state(false)
    const selected = $derived(options.find((o) => o.value === value) ?? null)

    const choose = (opt: SelectOption) => {
        if (opt.disabled) return
        onChange(opt.value)
        open = false
    }
</script>

<div>
    {#if label}
        <span class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70">{label}</span>
    {/if}
    <PressableScale onclick={() => (open = true)} class="block w-full" ariaLabel={label ?? 'Seleccionar'}>
        <span
            class="flex h-[52px] w-full items-center gap-3 rounded-[14px] px-3.5"
            style="border:1.5px solid hsla(214,32%,89%,0.9);background-color:hsla(0,0%,100%,0.7)"
        >
            {#if selected?.icon}
                <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style="background-color:hsla(217,91%,50%,0.12)"
                >
                    <selected.icon size={17} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </span>
            {/if}
            <span class="flex min-w-0 flex-1 flex-col text-left">
                <span
                    class="truncate text-base {selected
                        ? 'font-medium text-foreground'
                        : 'text-[hsl(215,16%,62%)]'}"
                >
                    {selected ? selected.label : placeholder}
                </span>
                {#if selected?.description}
                    <span class="truncate text-[11px] text-muted-foreground">{selected.description}</span>
                {/if}
            </span>
            <ChevronsUpDown size={18} color="hsl(215, 16%, 55%)" strokeWidth={2} />
        </span>
    </PressableScale>
</div>

<BottomSheet {open} title={sheetTitle ?? label} onClose={() => (open = false)}>
    <div class="flex flex-col gap-2 pb-1">
        {#each options as opt (opt.value)}
            {@const active = opt.value === value}
            <PressableScale
                onclick={() => choose(opt)}
                disabled={opt.disabled}
                class="block w-full"
                ariaLabel={opt.label}
            >
                <span
                    class="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 {active
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card'} {opt.disabled ? 'opacity-50' : ''}"
                >
                    {#if opt.icon}
                        <span
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style="background-color:hsla(217,91%,50%,0.12)"
                        >
                            <opt.icon size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                        </span>
                    {/if}
                    <span class="flex min-w-0 flex-1 flex-col text-left">
                        <span class="truncate text-sm font-semibold text-foreground">{opt.label}</span>
                        {#if opt.description}
                            <span class="truncate text-[11px] text-muted-foreground"
                                >{opt.description}</span
                            >
                        {/if}
                    </span>
                    {#if active}
                        <Check size={17} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
                    {/if}
                </span>
            </PressableScale>
        {/each}
    </div>
</BottomSheet>
