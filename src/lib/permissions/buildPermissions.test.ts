import { describe, expect, it } from "vitest";
import { buildPermissions, toPermissionsInput } from "./buildPermissions";
import type { UserProfile } from "$lib/api/requests/authentication/types";

// Sets de roles de fábrica equivalentes a los del módulo de roles (pos_api).
const VENDEDOR = ["canAccessPOS", "canAccessSalesReport"];
const CAJERO = [
  "canAccessPOS",
  "canAccessSalesReport",
  "canAccessInventory",
  "canAccessExpenses",
  "canAccessDashboard",
];

describe("buildPermissions", () => {
  it("Vendedor: ve POS y Ventas, NO ve inventario ni gastos fijos", () => {
    const p = buildPermissions({ type: "employee", permissions: VENDEDOR });
    expect(p.userType).toBe("employee");
    expect(p.isAdmin).toBe(false);
    expect(p.canAccessPOS).toBe(true);
    expect(p.canAccessSalesReport).toBe(true);
    expect(p.canAccessInventory).toBe(false);
    expect(p.canAccessExpenses).toBe(false);
    expect(p.canAccessFixedExpenses).toBe(false);
  });

  it("Cajero: ve inventario y gastos (variables) pero NO gastos fijos", () => {
    const p = buildPermissions({ type: "employee", permissions: CAJERO });
    expect(p.isAdmin).toBe(false);
    expect(p.canAccessInventory).toBe(true);
    expect(p.canAccessExpenses).toBe(true);
    expect(p.canAccessFixedExpenses).toBe(false);
    expect(p.canAccessPOS).toBe(true);
  });

  it("owner: acceso total aunque el array venga vacío", () => {
    const p = buildPermissions({ type: "owner", permissions: [] });
    expect(p.isAdmin).toBe(true);
    expect(p.canAccessDashboard).toBe(true);
    expect(p.canAccessFixedExpenses).toBe(true);
    expect(p.canAccessInventory).toBe(true);
    expect(p.canAccessPOS).toBe(true);
    expect(p.can("canAccessSuppliers")).toBe(true);
  });

  it("owner: acceso total aunque permissions sea undefined", () => {
    const p = buildPermissions({ type: "owner" });
    expect(p.isAdmin).toBe(true);
    expect(p.canAccessFixedExpenses).toBe(true);
  });

  it("superadmin: acceso total", () => {
    const p = buildPermissions({ type: "superadmin", permissions: [] });
    expect(p.isAdmin).toBe(true);
    expect(p.can("canAccessSettings")).toBe(true);
  });

  it("perfil null: sin tipo, sin permisos", () => {
    const p = buildPermissions(null);
    expect(p.userType).toBe(null);
    expect(p.isAdmin).toBe(false);
    expect(p.canAccessDashboard).toBe(false);
    expect(p.can("canAccessPOS")).toBe(false);
  });

  it("empleado sin array de permisos: no tiene acceso a nada", () => {
    const p = buildPermissions({ type: "employee" });
    expect(p.isAdmin).toBe(false);
    expect(p.canAccessPOS).toBe(false);
    expect(p.canAccessSalesReport).toBe(false);
  });
});

describe("buildPermissions · visibilidad financiera (subpermisos del configurador)", () => {
  it("owner: ve ganancia, margen, caja y ambos subpermisos siempre", () => {
    const p = buildPermissions({ type: "owner", permissions: [] });
    expect(p.canViewProfit).toBe(true);
    expect(p.canViewCash).toBe(true);
    expect(p.canViewProductMargin).toBe(true);
    expect(p.canViewProductProfit).toBe(true);
  });

  it("superadmin: idéntico al owner", () => {
    const p = buildPermissions({ type: "superadmin", permissions: [] });
    expect(p.canViewProductMargin).toBe(true);
    expect(p.canViewProductProfit).toBe(true);
  });

  it("empleado: cada flag manda de forma independiente", () => {
    const p = buildPermissions({
      type: "employee",
      permissions: ["canAccessPOS"],
      can_view_product_margin: true,
      can_view_product_profit: false,
    });
    expect(p.isAdmin).toBe(false);
    expect(p.canViewProductMargin).toBe(true);
    expect(p.canViewProductProfit).toBe(false);
  });

  it("empleado sin flags en el perfil: subpermisos por defecto false", () => {
    const p = buildPermissions({
      type: "employee",
      permissions: ["canAccessPOS"],
    });
    expect(p.canViewProfit).toBe(false);
    expect(p.canViewCash).toBe(false);
    expect(p.canViewProductMargin).toBe(false);
    expect(p.canViewProductProfit).toBe(false);
  });

  describe("isAdminLevel", () => {
    const ALL_KEYS = [
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

    it("owner/superadmin SIEMPRE son admin-level (aunque el array venga vacío)", () => {
      expect(
        buildPermissions({ type: "owner", permissions: [] }).isAdminLevel,
      ).toBe(true);
      expect(
        buildPermissions({ type: "superadmin", permissions: [] }).isAdminLevel,
      ).toBe(true);
    });

    it("empleado con rol Administrador (todas las keys) es admin-level", () => {
      const admin = buildPermissions({
        type: "employee",
        permissions: ALL_KEYS,
      });
      expect(admin.isAdmin).toBe(false);
      expect(admin.isAdminLevel).toBe(true);
    });

    it("Cajero (con canAccessDailyClosureReport pero no todas) NO es admin-level", () => {
      const cajeroKeys = ALL_KEYS.filter((k) => k !== "canAccessEmployees");
      const cajero = buildPermissions({
        type: "employee",
        permissions: cajeroKeys,
      });
      expect(cajero.canAccessDailyClosureReport).toBe(true);
      expect(cajero.isAdminLevel).toBe(false);
    });

    it("empleado sin permisos NO es admin-level", () => {
      expect(
        buildPermissions({ type: "employee", permissions: [] }).isAdminLevel,
      ).toBe(false);
    });
  });
});

describe("buildPermissions · costo del producto en el configurador (espejo placepos)", () => {
  it("owner y superadmin ven el costo siempre", () => {
    expect(
      buildPermissions({ type: "owner", permissions: [] }).canViewProductCost,
    ).toBe(true);
    expect(
      buildPermissions({ type: "superadmin", permissions: [] })
        .canViewProductCost,
    ).toBe(true);
  });

  it.each([
    [true, true, true],
    [true, false, true],
    [false, true, true],
    [false, false, false],
  ])(
    "empleado con margen=%s y ganancia=%s → ve costo: %s",
    (can_view_product_margin, can_view_product_profit, expected) => {
      const p = buildPermissions({
        type: "employee",
        permissions: ["canAccessPOS"],
        can_view_product_margin,
        can_view_product_profit,
      });
      expect(p.canViewProductCost).toBe(expected);
    },
  );

  it("el permiso general de ganancia NO basta: manda el subpermiso del configurador", () => {
    const p = buildPermissions({
      type: "employee",
      permissions: ["canAccessPOS"],
      can_view_profit: true,
      can_view_product_margin: false,
      can_view_product_profit: false,
    });
    expect(p.canViewProductCost).toBe(false);
  });

  it("empleado sin flags en el perfil (backend viejo): no ve el costo", () => {
    expect(
      buildPermissions({ type: "employee", permissions: ["canAccessPOS"] })
        .canViewProductCost,
    ).toBe(false);
  });

  it("sin perfil cargado: no ve el costo", () => {
    expect(buildPermissions(null).canViewProductCost).toBe(false);
  });
});

describe("toPermissionsInput (perfil → input de buildPermissions)", () => {
  const ADMIN_ROLE = [
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

  const make_profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: 7,
    name: "Ana",
    lastname: "Pérez",
    email: "ana@test.com",
    type: "employee",
    created_at: "2026-10-01T00:00:00.000Z",
    branches_enabled: false,
    branches_allowed: 0,
    permissions: ADMIN_ROLE,
    can_view_profit: true,
    can_view_cash: true,
    can_view_product_margin: true,
    can_view_product_profit: true,
    ...overrides,
  });

  it("regresión: empleado Administrador con flags activos ve costo, ganancia y margen", () => {
    const p = buildPermissions(toPermissionsInput(make_profile()));
    expect(p.isAdmin).toBe(false);
    expect(p.isAdminLevel).toBe(true);
    expect(p.canViewProductCost).toBe(true);
    expect(p.canViewProductProfit).toBe(true);
    expect(p.canViewProductMargin).toBe(true);
    expect(p.canViewProfit).toBe(true);
    expect(p.canViewCash).toBe(true);
  });

  it("empleado Administrador con flags apagados NO ve costo/ganancia/margen (el rol no los concede)", () => {
    const p = buildPermissions(
      toPermissionsInput(
        make_profile({
          can_view_profit: false,
          can_view_cash: false,
          can_view_product_margin: false,
          can_view_product_profit: false,
        }),
      ),
    );
    expect(p.isAdminLevel).toBe(true);
    expect(p.canViewProductCost).toBe(false);
    expect(p.canViewProductProfit).toBe(false);
    expect(p.canViewProductMargin).toBe(false);
    expect(p.canViewProfit).toBe(false);
    expect(p.canViewCash).toBe(false);
  });

  it("solo margen activo: ve margen y costo, NO la ganancia", () => {
    const p = buildPermissions(
      toPermissionsInput(make_profile({ can_view_product_profit: false })),
    );
    expect(p.canViewProductMargin).toBe(true);
    expect(p.canViewProductProfit).toBe(false);
    expect(p.canViewProductCost).toBe(true);
  });

  it("solo ganancia activa: ve ganancia y costo, NO el margen", () => {
    const p = buildPermissions(
      toPermissionsInput(make_profile({ can_view_product_margin: false })),
    );
    expect(p.canViewProductProfit).toBe(true);
    expect(p.canViewProductMargin).toBe(false);
    expect(p.canViewProductCost).toBe(true);
  });

  it("flags ausentes en el perfil (version-skew) → default false para el empleado", () => {
    const profile = make_profile();
    delete profile.can_view_product_margin;
    delete profile.can_view_product_profit;
    const p = buildPermissions(toPermissionsInput(profile));
    expect(p.canViewProductMargin).toBe(false);
    expect(p.canViewProductProfit).toBe(false);
    expect(p.canViewProductCost).toBe(false);
  });

  it("owner ve todo aunque el perfil traiga los flags en false", () => {
    const p = buildPermissions(
      toPermissionsInput(
        make_profile({
          type: "owner",
          permissions: [],
          can_view_product_margin: false,
          can_view_product_profit: false,
        }),
      ),
    );
    expect(p.isAdmin).toBe(true);
    expect(p.canViewProductCost).toBe(true);
    expect(p.canViewProductProfit).toBe(true);
    expect(p.canViewProductMargin).toBe(true);
  });

  it("cold start: sin perfil usa el tipo de auth y deja los flags en false", () => {
    expect(toPermissionsInput(undefined, "employee")).toEqual({
      type: "employee",
      permissions: undefined,
      can_view_profit: undefined,
      can_view_cash: undefined,
      can_view_product_margin: undefined,
      can_view_product_profit: undefined,
    });
    const p = buildPermissions(toPermissionsInput(undefined, "employee"));
    expect(p.canViewProductCost).toBe(false);
    expect(p.canAccessPOS).toBe(false);
  });

  it("cold start de owner: acceso total con solo el tipo de auth", () => {
    const p = buildPermissions(toPermissionsInput(null, "owner"));
    expect(p.isAdmin).toBe(true);
    expect(p.canViewProductMargin).toBe(true);
  });

  it("el tipo del perfil manda sobre el de auth", () => {
    const p = buildPermissions(toPermissionsInput(make_profile(), "owner"));
    expect(p.userType).toBe("employee");
    expect(p.isAdmin).toBe(false);
  });

  it("sin perfil ni tipo → null (sin permisos)", () => {
    expect(toPermissionsInput(undefined, null)).toBeNull();
    expect(toPermissionsInput(undefined)).toBeNull();
    const p = buildPermissions(toPermissionsInput(undefined));
    expect(p.userType).toBeNull();
    expect(p.canViewProductCost).toBe(false);
    expect(p.canAccessPOS).toBe(false);
  });
});
