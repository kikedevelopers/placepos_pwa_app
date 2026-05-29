<script lang="ts">
    import type { IconComponent } from '$lib/types/icon'
    import FadeInUp from '$lib/components/FadeInUp.svelte'

    interface Props {
        icon: IconComponent
        title: string
        description?: string
    }

    let { icon: Icon, title, description }: Props = $props()
</script>

<div class="flex flex-1 flex-col items-center justify-center bg-background px-8 py-20">
    <FadeInUp index={0} class="flex flex-col items-center">
        <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style="background-color: hsla(217, 91%, 50%, 0.12)"
        >
            <Icon size={30} color="hsl(217, 91%, 50%)" strokeWidth={1.8} />
        </div>
        <h2 class="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        <p class="mt-1.5 text-center text-sm text-muted-foreground">
            {description ?? 'Esta sección estará disponible próximamente.'}
        </p>
        <div
            class="mt-4 rounded-full px-3 py-1"
            style="background-color: hsla(217, 91%, 50%, 0.10)"
        >
            <span class="text-xs font-semibold text-primary">Próximamente</span>
        </div>
    </FadeInUp>
</div>
