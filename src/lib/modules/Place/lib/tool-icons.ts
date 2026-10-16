import type { Component } from 'svelte'
import Archive from '@lucide/svelte/icons/archive'
import ChartColumn from '@lucide/svelte/icons/chart-column'
import CircleCheck from '@lucide/svelte/icons/circle-check'
import CirclePlus from '@lucide/svelte/icons/circle-plus'
import Database from '@lucide/svelte/icons/database'
import HandCoins from '@lucide/svelte/icons/hand-coins'
import Landmark from '@lucide/svelte/icons/landmark'
import PackageMinus from '@lucide/svelte/icons/package-minus'
import PackageSearch from '@lucide/svelte/icons/package-search'
import ReceiptText from '@lucide/svelte/icons/receipt-text'
import TrendingUp from '@lucide/svelte/icons/trending-up'
import Trophy from '@lucide/svelte/icons/trophy'
import Truck from '@lucide/svelte/icons/truck'
import Users from '@lucide/svelte/icons/users'
import Wallet from '@lucide/svelte/icons/wallet'

/**
 * Ícono de cada herramienta de Place — espejo de `TOOL_ICONS` de placepos. La
 * etiqueta la manda el servidor; aquí solo se le pone cara. Una herramienta que
 * el cliente aún no conozca sale con el ícono genérico en vez de romper.
 */
export const TOOL_ICONS: Record<string, Component> = {
    get_daily_summary: ChartColumn,
    list_sales: ReceiptText,
    get_performance_range: TrendingUp,
    get_top_products: Trophy,
    search_products: PackageSearch,
    get_low_stock: PackageMinus,
    get_debtors: HandCoins,
    search_customers: Users,
    search_suppliers: Truck,
    get_expenses_summary: Wallet,
    get_treasury_accounts: Landmark,
    register_expense: CirclePlus,
    void_expense: Archive,
    confirm_expense_action: CircleCheck
}

export const describeToolIcon = (name: string): Component => TOOL_ICONS[name] ?? Database
