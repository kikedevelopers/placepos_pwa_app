/** Query keys del módulo Configuración. */
export const SETTINGS_KEYS = {
    company: ['settings', 'company'] as const,
    ticketSettings: ['settings', 'ticket-settings'] as const,
    posMargins: ['settings', 'pos-margins'] as const,
    strictInventory: ['settings', 'strict-inventory'] as const,
    alertConfig: (type: string) => ['settings', 'alert-config', type] as const
}
