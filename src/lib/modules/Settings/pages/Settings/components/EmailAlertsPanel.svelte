<script lang="ts">
    import { CalendarClock, Mail, Send } from '@lucide/svelte'
    import { toast } from 'svelte-sonner'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { ALERT_TYPE_CREDIT_DUE_TODAY } from '$lib/api/requests/emailAlerts'
    import {
        useEmailAlertsSettings,
        useSetEmailAlert,
        useTestCreditAlert
    } from '../hooks/useEmailAlerts'

    // Solo nivel admin (owner/superadmin o empleado con rol Administrador).
    const permissions = usePermissions()
    const query = useEmailAlertsSettings()
    const update = useSetEmailAlert()
    const test = useTestCreditAlert()

    const data = $derived($query.data)
    const creditAlert = $derived(data?.alerts.find((a) => a.type === ALERT_TYPE_CREDIT_DUE_TODAY))
    const isDev = import.meta.env.DEV

    const REASON: Record<string, string> = {
        'no-credits': 'no hay créditos que venzan hoy',
        'no-owner': 'el negocio no tiene un dueño con correo',
        'mail-disabled': 'el servicio de correo está deshabilitado',
        error: 'ocurrió un error'
    }

    // Estado optimista del switch (se sincroniza con el servidor; rollback en error).
    let creditEnabled = $state(false)
    $effect(() => {
        if (creditAlert) creditEnabled = creditAlert.enabled
    })

    function toggleCredit(enabled: boolean) {
        creditEnabled = enabled
        $update.mutate(
            { type: ALERT_TYPE_CREDIT_DUE_TODAY, enabled },
            {
                onError: (e) => {
                    creditEnabled = !enabled
                    toast.error(getErrorMessage(e) ?? 'No se pudo guardar la alerta')
                }
            }
        )
    }

    function runTest() {
        $test.mutate(undefined, {
            onSuccess: (r) =>
                r.sent
                    ? toast.success(`Correo de prueba enviado a ${r.recipientEmail}`)
                    : toast.info(`No se envió: ${REASON[r.reason ?? ''] ?? 'revisa la configuración'}`),
            onError: (e) => toast.error(getErrorMessage(e) ?? 'No se pudo enviar el correo de prueba')
        })
    }
</script>

{#if permissions.isAdminLevel}
    <div class="flex flex-col gap-3">
        <div class="rounded-2xl border border-border bg-card p-4">
            <h2 class="text-sm font-bold text-foreground">Alertas por correo</h2>
            <p class="mt-0.5 text-[11px] text-muted-foreground">
                Avisos que PlacePOS envía automáticamente al correo del administrador.
            </p>
        </div>

        <!-- Correo destino -->
        <div class="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
            <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style="background-color:hsla(217,91%,50%,0.12)"
            >
                <Mail size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </span>
            <div class="min-w-0">
                <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Las alertas llegan a
                </p>
                {#if $query.isLoading}
                    <p class="text-sm text-muted-foreground">Cargando…</p>
                {:else if data?.recipientEmail}
                    <p class="truncate text-sm font-medium text-foreground">{data.recipientEmail}</p>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No se encontró el correo del administrador.
                    </p>
                {/if}
            </div>
        </div>

        {#if $query.isError}
            <ScreenState kind="error" message={getErrorMessage($query.error)} />
        {:else if creditAlert}
            <ToggleSwitch
                variant="card"
                tone="success"
                icon={CalendarClock}
                label="Créditos que vencen hoy"
                description="Cada día, si hay créditos que vencen hoy, envía un correo con el detalle en PDF. Si no vence ninguno, no se envía nada."
                checked={creditEnabled}
                onChange={toggleCredit}
                disabled={$update.isPending}
            />
        {/if}

        {#if isDev}
            <div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Solo desarrollo
                </p>
                <div class="mt-2 flex items-center justify-between gap-3">
                    <p class="text-[11px] text-muted-foreground">
                        Envía un correo de prueba con datos de ejemplo para verificar el envío.
                    </p>
                    <button
                        type="button"
                        onclick={runTest}
                        disabled={$test.isPending}
                        class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-opacity active:opacity-70 disabled:opacity-60"
                    >
                        <Send size={16} />
                        Enviar prueba
                    </button>
                </div>
            </div>
        {/if}
    </div>
{/if}
