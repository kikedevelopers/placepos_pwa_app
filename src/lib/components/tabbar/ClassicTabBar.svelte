<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { ShoppingCart } from '@lucide/svelte'
    import { ACTIVE, INACTIVE, LEFT_TABS, RIGHT_TABS, type Tab } from './config'

    const pathname = $derived(page.url.pathname)
    const go = (route: string) => goto(route, { replaceState: true })
</script>

{#snippet tabItem(tab: Tab, active: boolean)}
    <button
        type="button"
        onclick={() => go(tab.route)}
        class="flex flex-1 flex-col items-center transition-opacity active:opacity-70"
    >
        <span
            class="rounded-full px-5 py-1"
            style={active ? 'background-color: hsla(217, 91%, 50%, 0.12)' : ''}
        >
            <tab.icon size={20} color={active ? ACTIVE : INACTIVE} strokeWidth={active ? 2.4 : 2} />
        </span>
        <span class="mt-1 text-[10px] font-medium" style="color:{active ? ACTIVE : INACTIVE}">
            {tab.label}
        </span>
    </button>
{/snippet}

<nav
    class="flex items-start border-t border-border/70 bg-card"
    style="padding-top:28px;padding-bottom:max(env(safe-area-inset-bottom),10px);box-shadow:0 -4px 12px hsla(222,47%,11%,0.06)"
>
    {#each LEFT_TABS as tab (tab.match)}
        {@render tabItem(tab, pathname === tab.match)}
    {/each}

    <button
        type="button"
        onclick={() => go('/pos')}
        class="flex flex-1 flex-col items-center transition-opacity active:opacity-90"
    >
        <span
            class="flex h-14 w-14 items-center justify-center rounded-full border-4 border-card"
            style="margin-top:-26px;background:linear-gradient(135deg,hsl(213,94%,60%),hsl(221,83%,45%));box-shadow:0 6px 12px hsla(217,91%,50%,{pathname === '/pos' ? 0.45 : 0.3})"
        >
            <ShoppingCart size={24} color="white" strokeWidth={2.2} />
        </span>
        <span
            class="mt-1 text-[10px] font-semibold"
            style="color:{pathname === '/pos' ? ACTIVE : INACTIVE}"
        >
            POS
        </span>
    </button>

    {#each RIGHT_TABS as tab (tab.match)}
        {@render tabItem(tab, pathname === tab.match)}
    {/each}
</nav>
