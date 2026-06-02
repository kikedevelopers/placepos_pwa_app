export const EXPENSES_TAB_VARIABLE = 'variable' as const
export const EXPENSES_TAB_FIXED = 'fixed' as const

export type ExpensesTab = typeof EXPENSES_TAB_VARIABLE | typeof EXPENSES_TAB_FIXED

export const EXPENSES_TABS: ExpensesTab[] = [EXPENSES_TAB_VARIABLE, EXPENSES_TAB_FIXED]

export const DEFAULT_EXPENSES_TAB: ExpensesTab = EXPENSES_TAB_VARIABLE

export const isExpensesTab = (value: string | null): value is ExpensesTab =>
    value === EXPENSES_TAB_VARIABLE || value === EXPENSES_TAB_FIXED

export const EXPENSES_TAB_QUERY_PARAM = 'tab' as const
