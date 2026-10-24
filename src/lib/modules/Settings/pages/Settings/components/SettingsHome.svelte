<script lang="ts">
    import { ChevronRight } from '@lucide/svelte'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import type { SettingsView } from '../types'
    import { visibleSettingsGroups } from '../constants/settingsMenu'

    let { onOpen }: { onOpen: (view: SettingsView) => void } = $props()

    const role = useUserRole()
    const groups = $derived(visibleSettingsGroups(role.role === 'owner'))
</script>

<div class="flex flex-col gap-6 px-5 pb-6 pt-5">
    <h1 class="text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground">Configuración</h1>

    {#each groups as group (group.title)}
        <section aria-label={group.title}>
            <h2 class="mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">{group.title}</h2>
            <div class="surface group-rows overflow-hidden">
                {#each group.entries as entry (entry.view)}
                    <button
                        type="button"
                        onclick={() => onOpen(entry.view)}
                        class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05]"
                    >
                        <span
                            class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
                            style="background-color:{entry.color}"
                        >
                            <entry.icon size={17} strokeWidth={2.2} />
                        </span>
                        <span class="min-w-0 flex-1">
                            <span class="block truncate text-[15px] text-foreground">{entry.label}</span>
                            <span class="block truncate text-[12px] text-muted-foreground">{entry.detail}</span>
                        </span>
                        <ChevronRight size={16} class="shrink-0 text-muted-foreground/50" />
                    </button>
                {/each}
            </div>
        </section>
    {/each}
</div>
