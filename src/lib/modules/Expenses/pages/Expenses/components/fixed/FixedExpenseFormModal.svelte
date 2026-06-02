<script lang="ts">
    import { untrack } from 'svelte'
    import { AlertCircle, X } from '@lucide/svelte'
    import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
    import FormField from '$lib/components/FormField.svelte'
    import MoneyInput from '$lib/components/MoneyInput.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import { PERIOD_UNIT_OPTIONS } from '$lib/modules/Expenses/constants/periodicity'
    import { useFixedExpenseForm } from '../../hooks/useFixedExpenseForm.svelte'

    interface Props {
        /** Gasto a editar, o null para crear. */
        expense: FixedExpense | null
        onClose: () => void
    }
    let { expense, onClose }: Props = $props()

    // El modal se remonta por gasto vía {#key}, así que capturar el valor
    // inicial de expense/onClose es intencional (untrack silencia el aviso).
    const ctrl = untrack(() => useFixedExpenseForm(expense, onClose))

    const BORDER = 'hsla(214, 32%, 89%, 0.9)'

    const onQtyInput = (e: Event) => {
        const raw = (e.currentTarget as HTMLInputElement).value.replace(/[^\d]/g, '')
        ctrl.form.period_quantity = raw ? Number(raw) : 0
    }
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-background motion-safe:animate-slide-up">
    <!-- Header -->
    <div class="border-b border-border/70 bg-card pt-[env(safe-area-inset-top)]">
        <div class="flex items-center justify-between px-3 py-2">
            <button
                type="button"
                onclick={onClose}
                aria-label="Cerrar"
                class="flex h-10 w-10 items-center justify-center rounded-xl transition-opacity active:opacity-60"
            >
                <X size={22} color="hsl(215, 16%, 40%)" />
            </button>
            <h2 class="text-base font-bold text-foreground">
                {ctrl.isEdit ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
            </h2>
            <div class="w-10"></div>
        </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-5">
        <div class="flex flex-col gap-4">
            <FormField
                label="Nombre"
                bind:value={ctrl.form.name}
                placeholder="Ej. Arriendo local, internet, salario"
                maxlength={120}
                error={ctrl.errors.name}
            />

            <MoneyInput
                label="Monto"
                prefix="$"
                value={ctrl.form.amount || null}
                onValueChange={(v) => (ctrl.form.amount = v ?? 0)}
                placeholder="1 800 000"
                error={ctrl.errors.amount}
            />

            <!-- Periodicidad: cantidad + unidad -->
            <div>
                <span
                    class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
                >
                    Periodicidad
                </span>
                <div class="grid grid-cols-[88px_1fr] gap-2">
                    <div
                        class="flex h-[52px] items-center rounded-[14px] px-3.5"
                        style="border:1.5px solid {BORDER};background-color:hsla(0,0%,100%,0.7)"
                    >
                        <input
                            value={ctrl.form.period_quantity || ''}
                            oninput={onQtyInput}
                            inputmode="numeric"
                            placeholder="1"
                            class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-[hsl(215,16%,62%)]"
                        />
                    </div>
                    <div
                        class="flex h-[52px] items-center rounded-[14px] px-2"
                        style="border:1.5px solid {BORDER};background-color:hsla(0,0%,100%,0.7)"
                    >
                        <select
                            bind:value={ctrl.form.period_unit}
                            class="w-full bg-transparent px-1.5 text-base text-foreground outline-none"
                        >
                            {#each PERIOD_UNIT_OPTIONS as opt (opt.value)}
                                <option value={opt.value}>{opt.plural}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <p class="mt-1.5 ml-0.5 text-xs text-muted-foreground">
                    Cuánto dura un periodo del gasto (ej. cada 1 mes, cada 15 días, cada 8 horas).
                </p>
                {#if ctrl.errors.period_quantity || ctrl.errors.period_unit}
                    <p class="mt-1.5 ml-0.5 text-xs text-destructive">
                        {ctrl.errors.period_quantity ?? ctrl.errors.period_unit}
                    </p>
                {/if}
            </div>

            <!-- Fecha de inicio -->
            <div>
                <label
                    for="fe-start-date"
                    class="mb-2 ml-0.5 block text-[13px] font-semibold text-foreground/70"
                >
                    Fecha de inicio
                </label>
                <div
                    class="flex h-[52px] items-center rounded-[14px] px-3.5"
                    style="border:1.5px solid {BORDER};background-color:hsla(0,0%,100%,0.7)"
                >
                    <input
                        id="fe-start-date"
                        type="date"
                        bind:value={ctrl.form.start_date}
                        class="w-full bg-transparent text-base text-foreground outline-none"
                    />
                </div>
                <p class="mt-1.5 ml-0.5 text-xs text-muted-foreground">
                    Desde cuándo se empieza a contar la acumulación.
                </p>
                {#if ctrl.errors.start_date}
                    <p class="mt-1.5 ml-0.5 text-xs text-destructive">{ctrl.errors.start_date}</p>
                {/if}
            </div>

            <FormField
                label="Descripción"
                bind:value={ctrl.form.description}
                placeholder="Detalle opcional (proveedor, número de contrato, etc.)"
                multiline
                maxlength={500}
                error={ctrl.errors.description}
            />

            {#if ctrl.submitError}
                <div
                    class="flex items-start gap-2 rounded-xl px-3 py-2.5"
                    style="background-color:hsla(0,84%,55%,0.10);border:1px solid hsla(0,84%,55%,0.30)"
                >
                    <AlertCircle size={15} color="hsl(0, 84%, 55%)" />
                    <span class="flex-1 text-xs leading-4 text-destructive">{ctrl.submitError}</span>
                </div>
            {/if}
        </div>
    </div>

    <!-- Footer -->
    <div
        class="border-t border-border/70 bg-card px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
    >
        <PrimaryButton
            label={ctrl.isEdit ? 'Guardar cambios' : 'Crear gasto fijo'}
            loading={ctrl.isSubmitting}
            onclick={ctrl.submit}
        />
    </div>
</div>
