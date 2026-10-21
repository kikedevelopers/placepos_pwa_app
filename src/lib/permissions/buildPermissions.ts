import type { UserProfile } from "$lib/api/requests/authentication/types";

export type UserType = "employee" | "owner" | "superadmin";

/**
 * Catálogo de las 22 keys de permiso gestionables (gemelo del catálogo de
 * placepos desktop). `canAccessLicenses` NO forma parte del array gestionable:
 * es un módulo interno que en este cliente web no se expone.
 */
export interface Permissions {
  canAccessDashboard: boolean;
  canAccessCustomers: boolean;
  canAccessInventory: boolean;
  canAccessPackaging: boolean;
  canAccessCategories: boolean;
  canAccessCarriers: boolean;
  canAccessSalesReport: boolean;
  canAccessCreditsReport: boolean;
  canAccessComparativeReport: boolean;
  canAccessDailyClosureReport: boolean;
  canAccessCashierReport: boolean;
  canAccessClientsReport: boolean;
  canViewAllSales: boolean;
  canAccessBanks: boolean;
  canAccessWallets: boolean;
  canAccessExpenses: boolean;
  canAccessFixedExpenses: boolean;
  canAccessEmployees: boolean;
  canAccessSuppliers: boolean;
  canAccessSettings: boolean;
  canAccessPOS: boolean;
  canAccessPurchase: boolean;
}

export type PermissionKey = keyof Permissions;

/**
 * Las 22 keys gestionables (rol Administrador de fábrica). Un empleado con rol
 * Administrador las tiene TODAS; ningún otro rol de fábrica las tiene todas.
 * Deriva `isAdminLevel`.
 */
const MANAGED_PERMISSION_KEYS: PermissionKey[] = [
  "canAccessDashboard",
  "canAccessPOS",
  "canAccessInventory",
  "canAccessPackaging",
  "canAccessCategories",
  "canAccessBanks",
  "canAccessWallets",
  "canAccessCustomers",
  "canAccessEmployees",
  "canAccessCarriers",
  "canAccessSuppliers",
  "canAccessPurchase",
  "canAccessSalesReport",
  "canAccessCreditsReport",
  "canAccessComparativeReport",
  "canAccessDailyClosureReport",
  "canAccessCashierReport",
  "canAccessClientsReport",
  "canViewAllSales",
  "canAccessExpenses",
  "canAccessFixedExpenses",
  "canAccessSettings",
];

export interface ResolvedPermissions extends Permissions {
  userType: UserType | null;
  isAdmin: boolean;
  /**
   * Nivel ADMIN: owner/superadmin, o empleado con rol Administrador (todas las
   * keys gestionables). Un Cajero NO es admin-level aunque tenga
   * `canAccessDailyClosureReport`. Gatea el "Resumen Sucursales".
   */
  isAdminLevel: boolean;
  /** Predicado genérico: `isAdmin || granted.has(key)`. */
  can: (key: PermissionKey) => boolean;
  // Visibilidad financiera. owner/superadmin siempre; empleado según su flag
  // (default false si el perfil no lo trae). Espejo de placepos desktop.
  canViewProfit: boolean;
  canViewCash: boolean;
  // Subpermisos de `canViewProfit`: Margen (%) y Ganancia ($) en el
  // configurador de producto del POS. owner/superadmin siempre; empleado según
  // cada flag. El resto de la app sigue gateado por `canViewProfit`.
  canViewProductMargin: boolean;
  canViewProductProfit: boolean;
  // Costo del producto en el configurador del POS. Mismo gate que placepos:
  // basta CUALQUIERA de los dos subpermisos, porque con el margen o la
  // ganancia el costo ya se deduce del precio.
  canViewProductCost: boolean;
}

/**
 * Construye el objeto de permisos a partir del array de keys efectivas que el
 * backend (pos_api) entrega en `user_profile.permissions`. Es una función pura
 * (espejo de `buildPermissions.ts` del cliente Electron) para poder testearla
 * sin montar el store ni el hook.
 *
 * owner/superadmin tienen acceso total por robustez aunque el backend ya les
 * envíe las 22 keys: el flag `isAdmin` nunca depende del array.
 */
export const buildPermissions = (
  userProfile: Pick<
    UserProfile,
    | "type"
    | "permissions"
    | "can_view_profit"
    | "can_view_cash"
    | "can_view_product_margin"
    | "can_view_product_profit"
  > | null,
): ResolvedPermissions => {
  const userType = (userProfile?.type as UserType) || null;
  const isAdmin = userType === "owner" || userType === "superadmin";

  const granted = new Set(userProfile?.permissions ?? []);
  const can = (key: PermissionKey): boolean => isAdmin || granted.has(key);
  const isAdminLevel =
    isAdmin || MANAGED_PERMISSION_KEYS.every((key) => granted.has(key));

  // owner/superadmin ven todo siempre; el empleado depende de cada flag.
  const canViewProfit = isAdmin || (userProfile?.can_view_profit ?? false);
  const canViewCash = isAdmin || (userProfile?.can_view_cash ?? false);
  const canViewProductMargin =
    isAdmin || (userProfile?.can_view_product_margin ?? false);
  const canViewProductProfit =
    isAdmin || (userProfile?.can_view_product_profit ?? false);

  return {
    userType,
    isAdmin,
    isAdminLevel,
    can,
    canViewProfit,
    canViewCash,
    canViewProductMargin,
    canViewProductProfit,
    canViewProductCost: canViewProductMargin || canViewProductProfit,
    canAccessDashboard: can("canAccessDashboard"),
    canAccessCustomers: can("canAccessCustomers"),
    canAccessInventory: can("canAccessInventory"),
    canAccessPackaging: can("canAccessPackaging"),
    canAccessCategories: can("canAccessCategories"),
    canAccessCarriers: can("canAccessCarriers"),
    canAccessSalesReport: can("canAccessSalesReport"),
    canAccessCreditsReport: can("canAccessCreditsReport"),
    canAccessComparativeReport: can("canAccessComparativeReport"),
    canAccessDailyClosureReport: can("canAccessDailyClosureReport"),
    canAccessCashierReport: can("canAccessCashierReport"),
    canAccessClientsReport: can("canAccessClientsReport"),
    canViewAllSales: can("canViewAllSales"),
    canAccessBanks: can("canAccessBanks"),
    canAccessWallets: can("canAccessWallets"),
    canAccessExpenses: can("canAccessExpenses"),
    canAccessFixedExpenses: can("canAccessFixedExpenses"),
    canAccessEmployees: can("canAccessEmployees"),
    canAccessSuppliers: can("canAccessSuppliers"),
    canAccessSettings: can("canAccessSettings"),
    canAccessPOS: can("canAccessPOS"),
    canAccessPurchase: can("canAccessPurchase"),
  };
};

type PermissionsInput = Parameters<typeof buildPermissions>[0];

/**
 * Arma el input de `buildPermissions` a partir del `user_profile` del perfil.
 * Conserva TODOS los flags de visibilidad del empleado (`can_view_profit`,
 * `can_view_cash`, `can_view_product_margin`, `can_view_product_profit`):
 * antes el hook sólo pasaba `{ type, permissions }` y un empleado con los
 * flags activos no veía costo/ganancia/margen en el configurador del POS.
 *
 * `fallback_type` (de `auth.user`) cubre el cold start, antes de que el perfil
 * resuelva; en ese caso los flags quedan sin definir (default false).
 */
export const toPermissionsInput = (
  profile: UserProfile | null | undefined,
  fallback_type?: string | null,
): PermissionsInput => {
  const type = profile?.type ?? fallback_type;
  if (!type) return null;
  return {
    type,
    permissions: profile?.permissions,
    can_view_profit: profile?.can_view_profit,
    can_view_cash: profile?.can_view_cash,
    can_view_product_margin: profile?.can_view_product_margin,
    can_view_product_profit: profile?.can_view_product_profit,
  };
};
