<script lang="ts">
    import { Plus, Sparkles } from '@lucide/svelte'

    interface Props {
        /** Solo se muestra el CTA si el usuario puede gestionar. */
        canManage: boolean
        onCreate: () => void
    }
    let { canManage, onCreate }: Props = $props()
</script>

<div
    class="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"
>
    <div
        class="pointer-events-none absolute inset-0"
        style="background:linear-gradient(135deg, hsla(258,90%,62%,0.07), transparent 50%, hsla(340,82%,60%,0.07))"
    ></div>
    <div class="relative mx-auto max-w-sm space-y-4">
        <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style="background:linear-gradient(135deg, hsl(258,90%,62%), hsl(340,82%,60%));box-shadow:0 12px 24px hsla(258,90%,55%,0.35)"
        >
            <Sparkles size={30} color="white" strokeWidth={2} />
        </div>
        <div>
            <h3 class="text-lg font-bold text-foreground">Aún no tienes gastos fijos</h3>
            <p class="mt-1.5 text-sm leading-5 text-muted-foreground">
                Registra cuánto te cuesta el negocio mes a mes (arriendo, servicios, salarios) y
                verás cómo se acumula en tiempo real.
            </p>
        </div>
        {#if canManage}
            <button
                type="button"
                onclick={onCreate}
                class="mx-auto flex h-12 items-center gap-2 rounded-[14px] px-5 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                style="background:linear-gradient(135deg, hsl(258,90%,62%), hsl(340,82%,60%));box-shadow:0 10px 20px hsla(258,90%,55%,0.30)"
            >
                <Plus size={18} color="white" strokeWidth={2.4} />
                Crear primer gasto fijo
            </button>
        {/if}
    </div>
</div>
