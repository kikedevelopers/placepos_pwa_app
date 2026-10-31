<script lang="ts">
    import { untrack } from 'svelte'
    import { Bell } from '@lucide/svelte'
    import { notificationsCenter } from '$lib/stores/notificationsCenter.svelte'
    import { useUnreadNotificationsCount } from '../hooks/useNotifications.svelte'

    /**
     * Campana del header (sobre el azul de la marca). El contador sin leer
     * entra con un pequeño rebote cuando sube: comunica "llegó algo" sin
     * distraer (de 0.85, nunca de 0).
     */
    const unread = useUnreadNotificationsCount()
    const count = $derived(unread.count)
    const label = $derived(count > 99 ? '99+' : String(count))

    let pulse = $state(0)
    let previous = 0
    $effect(() => {
        if (count > previous) pulse = untrack(() => pulse) + 1
        previous = count
    })
</script>

<button
    type="button"
    aria-label={count > 0 ? `Notificaciones, ${count} sin leer` : 'Notificaciones'}
    onclick={() => notificationsCenter.open()}
    class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-white/25 transition-[transform,background-color] duration-100 ease-out active:scale-[0.94] active:bg-white/25"
    style="background:rgba(255,255,255,0.14);box-shadow:inset 0 1px 0 rgba(255,255,255,0.25)"
>
    <Bell size={19} color="white" strokeWidth={2} />
    {#if count > 0}
        {#key pulse}
            <span
                class="badge absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-destructive px-[5px] text-[10.5px] font-bold tabular-nums text-white ring-2 ring-[hsl(var(--primary))]"
            >
                {label}
            </span>
        {/key}
    {/if}
</button>

<style>
    .badge {
        animation: badge-pop 320ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    @keyframes badge-pop {
        from {
            transform: scale(0.85);
            opacity: 0.6;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .badge {
            animation: none;
        }
    }
</style>
