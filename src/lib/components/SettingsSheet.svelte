<script lang="ts">
    import { goto } from '$app/navigation'
    import { ChevronRight, LogOut, Moon, Settings, Sun } from '@lucide/svelte'
    import type { IconComponent } from '$lib/types/icon'
    import { useLogout } from '$lib/hooks/useLogout'
    import { theme, type ThemeMode } from '$lib/stores/theme.svelte'

    interface Props {
        open: boolean
        onClose: () => void
    }

    let { open, onClose }: Props = $props()
    const logout = useLogout()

    const goTo = (path: string) => {
        onClose()
        goto(path)
    }

    const handleLogout = () => {
        onClose()
        logout()
    }
</script>

{#if open}
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
        <!-- backdrop -->
        <button
            type="button"
            aria-label="Cerrar"
            class="absolute inset-0 bg-black/40"
            onclick={onClose}
        ></button>

        <div
            class="relative mx-auto w-full max-w-[480px] rounded-t-3xl bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] motion-safe:animate-slide-up"
        >
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border"></div>
            <h3 class="mb-2 text-base font-bold text-foreground">Ajustes</h3>

            <!-- Tema -->
            <div class="flex items-center justify-between py-3">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-9 w-9 items-center justify-center rounded-xl"
                        style="background-color: hsla(217, 91%, 50%, 0.12)"
                    >
                        {#if theme.mode === 'dark'}
                            <Moon size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                        {:else}
                            <Sun size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                        {/if}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-foreground">Tema</p>
                        <p class="text-[10px] text-muted-foreground">Modo oscuro próximamente</p>
                    </div>
                </div>
                <div class="flex rounded-full bg-secondary p-1">
                    {#each ['light', 'dark'] as const as m (m)}
                        <button
                            type="button"
                            onclick={() => theme.setMode(m as ThemeMode)}
                            class="rounded-full px-3 py-1 text-xs font-semibold transition-opacity active:opacity-80 {theme.mode ===
                            m
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground'}"
                        >
                            {m === 'light' ? 'Claro' : 'Oscuro'}
                        </button>
                    {/each}
                </div>
            </div>

            {#snippet menuRow(Icon: IconComponent, label: string, onclick: () => void, destructive = false)}
                <button
                    type="button"
                    {onclick}
                    class="flex w-full items-center justify-between py-3 transition-opacity active:opacity-70"
                >
                    <span class="flex items-center gap-3">
                        <span
                            class="flex h-9 w-9 items-center justify-center rounded-xl"
                            style="background-color: {destructive
                                ? 'hsla(0, 84%, 55%, 0.12)'
                                : 'hsla(215, 16%, 47%, 0.10)'}"
                        >
                            <Icon
                                size={18}
                                color={destructive ? 'hsl(0, 84%, 55%)' : 'hsl(215, 16%, 47%)'}
                                strokeWidth={2}
                            />
                        </span>
                        <span
                            class="text-sm font-medium {destructive
                                ? 'text-destructive'
                                : 'text-foreground'}">{label}</span
                        >
                    </span>
                    {#if !destructive}
                        <ChevronRight size={18} color="hsl(215, 16%, 60%)" />
                    {/if}
                </button>
            {/snippet}

            {@render menuRow(Settings, 'Ir a configuraciones', () => goTo('/configuracion'))}
            <div class="my-1 h-px bg-border/60"></div>
            {@render menuRow(LogOut, 'Cerrar sesión', handleLogout, true)}
        </div>
    </div>
{/if}
