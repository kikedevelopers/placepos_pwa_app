# Roadmap de migración pos_app (React Native) → placepos_pwa_app (SvelteKit)

## 1. Estado global por módulo

| # | Módulo | Status | Esfuerzo | Prioridad | Bloquea a |
|---|--------|--------|----------|-----------|-----------|
| 1 | DataLayer (api/stores/sesión) | **parcial** | M | **1** | POS, Customers, Purchases |
| 2 | DesignSystem (tokens + componentes) | completo | S | 5 | — (ya consumido por todos) |
| 3 | Authentication / Login | completo | S | 5 | — |
| 4 | Home / Dashboard | completo | S | 5 | — |
| 5 | Inventory | completo | S | 5 | — (plantilla de referencia) |
| 6 | Reports | completo | S | 5 | — |
| 7 | Configuración / Ajustes | completo | S | 5 | — |
| 8 | **Customers (Clientes)** | **stub** | M | 2 | POS (selector de cliente) |
| 9 | **Purchases (Compras)** | **stub** | M | 3 | — |
| 10 | **Expenses (Gastos)** | **stub** | L | 3 | — (sin diseño fuente) |
| 11 | **POS (Punto de venta)** | **stub** | XL | 1 | — (depende de DataLayer + items/clientes/caja) |

**Resumen:** 6 módulos completos, 1 parcial (DataLayer), 4 stubs (Customers, Purchases, Expenses, POS). El trabajo real se concentra en 5 unidades.

---

## 2. Orden de ejecución recomendado

El criterio es: primero los prerequisitos transversales, luego de menor a mayor riesgo, dejando POS al final porque consume todo lo anterior.

```
FASE 0  DataLayer (requests cash/customers/pos/purchases + useResponsive)   [PRIORIDAD 1, prerequisito duro]
   │
   ├──FASE 1  Customers   (M)  ── usa requests/customers ──► también consumido por POS
   │
   ├──FASE 2  Purchases   (M)  ── usa requests/purchases ── independiente
   │
   ├──FASE 3  Expenses    (L)  ── requiere validar diseño con el usuario antes de codear
   │
   └──FASE 4  POS         (XL) ── usa requests/pos + cash + sales + Customers (selector)
```

Notas de dependencia clave:
- **DataLayer va primero**: los 4 módulos de requests (cash, customers, pos, purchases) son prerequisito de las pantallas. Es trabajo mecánico (copiar y reapuntar imports).
- **Customers antes que POS**: el `CustomerSelectorView` del POS reutiliza el contrato de clientes. Migrar Customers primero deja resuelto el dominio y los tipos.
- **Expenses no bloquea a nadie** pero **no tiene diseño fuente en pos_app** → requiere decisión de UX del usuario antes de empezar; por eso se intercala pero con bandera de "validar antes".
- **POS al final**: es XL y necesita items/customers/banks/cash + sales ya disponibles.

---

## 3. Pasos concretos por módulo pendiente/parcial

### FASE 0 — DataLayer (parcial → completo) · PRIORIDAD 1 · M

Objetivo: añadir los 4 módulos de requests ausentes + `useResponsive`. Es copiar de pos_app reapuntando alias de import (`@/api/...` → `$lib/api/...`).

**Archivos PWA a crear:**
- `/Volumes/KiKe 1/development/placepos_pwa_app/src/lib/api/requests/cash/index.ts` + `types.ts` — `getCashSummary` (`GET /pos-data/cash-summary`), `getTransferDestinations` (`GET /pos-data/transfer-destinations`), `closeCash` (`POST /pos-data/close-cash`, **conservar header `Idempotency-Key`**). Tipos: `CashSummary`, `CloseCashPayload`, `CloseCashResult`, `TransferDestinations`.
- `.../requests/customers/index.ts` + `types.ts` — `getCustomers`, `getCustomerAnalytics`, `createCustomer`, `updateCustomer`. Tipos: `Customer`, `CustomerAnalytics`, `CustomerListParams`, `CustomerPayload`, `PersonType`.
- `.../requests/pos/index.ts` + `types.ts` — `getPosItems` (`/pos-data/items`), `getPosCustomers`, `getPosBanks` (`/pos-data/payment-banks`), `createSale` (`POST /sales`), `processPayment` (`POST /payments`). Tipos: `PosProduct`, `PosCustomer`, `PosBank`, `CreateSalePayload/Result`, `ProcessPaymentPayload/Result`, `PaymentMethod`.
- `.../requests/purchases/index.ts` + `types.ts` — `getPurchases(showAll)`. Tipos: `Purchase`, `PurchaseCredit`, `PurchaseCreditStatus`.
- `.../hooks/useResponsive.svelte.ts` — `$state(width)` con listener `resize` bajo guard `browser`; expone `{width, isTablet(>=768), columns, contentMaxWidth(720)}`. (Solo si POS/Customers lo consumen.)

**Archivos PWA a editar:**
- `.../requests/index.ts` — añadir `export * from './cash'`, `'./customers'`, `'./pos'`, `'./purchases'`.

**NO portar:** `useLiquidGlass` (nativo iOS, sin equivalente web → usar `SUPPORTS_LIQUID_GLASS=false`).

**Crítico:** replicar **verbatim** las query keys para invalidaciones cruzadas: `['pos','items']`, `['pos','customers']`, `['pos','banks']`, `['pos','cash-summary']`, `['pos','transfer-destinations']`, `['sales','today']`, `['sales','detail',id]`, `['purchases','list',showAll]`, `CUSTOMER_KEYS.list/analytics`.

---

### FASE 1 — Customers (stub → completo) · PRIORIDAD 2 · M

Réplica casi mecánica del módulo **Inventory** ya migrado (misma estructura pages/components/hooks/schemas). Backend `@Controller('customers')` ya existe.

**Archivos a crear** (bajo `/Volumes/KiKe 1/development/placepos_pwa_app/src/lib/modules/Customers/`):
- `constants/queryKeys.ts` — `CUSTOMER_KEYS = { list:['customers','list'], analytics:['customers','analytics'] }`.
- `pages/Customers/schemas/customer.schema.ts` — copia directa del zod de pos_app (enum `person_type`, `name` min1/max200, superRefine NIT requerido en COMPANY + `EMAIL_REGEX`).
- `pages/Customers/hooks/useCustomers.ts` — `createQuery` x2 (list + analytics).
- `pages/Customers/hooks/useCustomerMutations.ts` — create/update; **invalidar AMBAS keys** (list y analytics).
- `pages/Customers/hooks/useCustomerForm.svelte.ts` — espejo de `useProductForm.svelte.ts` (runes `$state`, flag `attempted`, `safeParse`, `blankToUndefined`, `name.trim()`). Sin Haptics.
- `pages/Customers/components/PersonTypeToggle.svelte` — segmented control Persona/Empresa.
- `pages/Customers/components/CustomerFormFields.svelte` — `PersonTypeToggle` + 5 `FormField` con labels condicionales a `isCompany` (Nombre↔Razón social, Documento↔NIT).
- `pages/Customers/components/CustomerFormModal.svelte` — espejo de `ProductFormModal.svelte` (`{#key editing?.id ?? 'new'}` + `untrack`).
- `pages/Customers/components/CustomerCard.svelte` — avatar condicional `Building2`/`User`, meta `doc_number·phone`, email, `ChevronRight`.
- `pages/Customers/pages/Customers.svelte` — espejo de `Inventory.svelte`: `SearchField`+`useDebouncedValue(250)`, `useUserRole`, 2 `StatTile` (`Users` azul / `UserPlus` verde), `ScreenState`, lista filtrada cliente por `name/email/doc_number`.

**Archivo a editar:**
- `src/routes/(app)/clientes/+page.svelte` — reemplazar `ComingSoon` por `<Customers />`.

**Decisión abierta:** layout columna única (convención PWA/Inventory) vs grid 2-col. Recomendado: columna única.

---

### FASE 2 — Purchases (stub → completo) · PRIORIDAD 3 · M

Listado **read-only** (sin detalle, sin creación, sin mutaciones). Backend `GET /purchases` ya existe.

**Archivos a crear:**
- `.../lib/modules/Purchases/constants/queryKeys.ts` — `PURCHASE_KEYS.list = (showAll)=>['purchases','list',showAll]`.
- `.../Purchases/pages/Purchases/hooks/usePurchases.ts` — `createQuery` con queryKey **reactivo** (`$derived`/getter) para refetch al cambiar `showAll`.
- `.../Purchases/pages/Purchases/components/PurchaseCard.svelte` — icono `Truck`, badge `Recibido`(success)/`Pendiente`(warning), Total `formatCurrency`, Saldo `Pagada`(success)/`balance`(destructive). No-pressable.
- `.../Purchases/pages/Purchases/Purchases.svelte` — 2 grupos `FilterChips` (scope con-saldo/todas + fecha all/today/7d/month), `SearchField` debounce 250, 3 `StatTile` (`ShoppingBag`/`CalendarDays`/`Wallet`), filtrado de fecha y búsqueda en cliente, `ScreenState`.

**Archivo a editar:**
- `src/routes/(app)/compras/+page.svelte` — reemplazar `ComingSoon` por `<Purchases />`.

**Punto de cuidado:** reactividad del `queryKey` con `scope` en svelte-query (debe ser `$derived` o no refetchea). `FilterChips` tipa `value:string` → cast al usar presets tipados.

---

### FASE 3 — Expenses (stub → completo) · PRIORIDAD 3 · L · ⚠️ requiere validar diseño primero

**pos_app NO tiene pantalla de Gastos** (solo la pestaña en tabbar + KPI agregado en dashboard). La fuente de verdad es el módulo `expenses` de **pos_api** (CRUD + void + payment-methods). La "copia fiel" aquí = fidelidad a las convenciones de Inventory, no a una pantalla concreta → **validar layout con el usuario antes de codear.**

**Archivos a crear:**
- `src/lib/api/requests/expenses/index.ts` + `types.ts` — `getExpenses` (`GET /expenses` con filtros), `getExpensePaymentMethods` (`GET /expenses/payment-methods`), `getExpense`, `createExpense` (`POST`), `updateExpense` (`PUT`, solo description/category/notes), `voidExpense` (`POST /:id/void`). Tipos: `Expense`, `ExpenseSourceType`, `EXPENSE_CATEGORIES`, DTOs, `ListExpensesResponse`, `PaymentMethodsResponse`.
- `src/lib/modules/Expenses/constants/queryKeys.ts` — `EXPENSE_KEYS.list/detail/paymentMethods`.
- `.../Expenses/pages/Expenses/hooks/{useExpenses,usePaymentMethods,useExpenseMutations,useExpenseForm.svelte}.ts`.
- `.../Expenses/pages/Expenses/components/{Expenses,ExpenseCard,ExpenseFormModal,ExpenseFormFields,SourcePicker}.svelte`.

**Archivo a editar:**
- `src/routes/(app)/gastos/+page.svelte` — añadir `export * from './expenses'` en barrel de requests + reemplazar `ComingSoon`.

**Reglas de negocio duras a respetar:**
- Roles: GET = owner|manager|employee; POST/PUT = owner|manager; **void = SOLO owner**.
- **Edición restringida**: PUT solo cambia description/category/notes → la UI debe **bloquear/ocultar** amount/source/expense_date. Para corregir monto/fuente: void + recrear.
- **void (no DELETE)**: revierte balance, marca `is_archived`. Manejar 422 (ya anulado, cuenta archivada, sin caja abierta).
- `cash_register`: el `source_id` se ignora server-side (caja por turno).
- `totalAmount`/`activeCount` son **por página**, no históricos → alinear con filtros de fecha o no presentarlos como "total del periodo".
- Decidir filtrado **server-side** (fechas/paginación) para fidelidad real, vs client-side de Inventory.

---

### FASE 4 — POS (stub → completo) · PRIORIDAD 1 (impacto) · XL

El módulo más grande (18 archivos, ~1500 LOC). Backend completo, no requiere cambios. Mucha infraestructura ya lista (FilterChips, MoneyInput, PrimaryButton, SearchField, requests/sales GET, TicketViewer, useUserRole, receipt). Requiere FASE 0 hecha.

**Secuencia interna:**
1. **(prerequisito FASE 0)** requests `pos` + `cash` ya creados.
2. **Store de carrito** `src/lib/modules/POS/store/posCart.svelte.ts` — clase singleton con runes replicando `usePosCart`: `cart/customer/total`, `addToCart` (fusión por `item_id+price+note`), `lineCalc` (total/profit/margin con `roundTo`), `updateQuantity` (<=0 elimina), `clearCart` (limpia customer). ⚠️ pasar de zustand `getState()` a singleton reactivo.
3. **Hooks**: `usePosData.ts` (items/customers/banks), `useCash.ts` (summary/destinations/closeCash), `usePayment.svelte.ts` (cobro + override + idempotencia), `constants/queryKeys.ts`, `useSales` reutiliza `getSales/getSale`.
4. **Catálogo**: `ProductCard.svelte` + `Pos.svelte` (header inmersivo, `SearchField`+scanner, grid responsive `grid-cols-2 md:grid-cols-4`, filtrado debounce por name/sku/bar_code, barra flotante "Ver carrito" con `env(safe-area-inset-bottom)`). Montar en `src/routes/pos/+page.svelte`.
5. **ProductConfigurator.svelte** — bottom-sheet, chips P1..Pn + Manual, stepper, nota, validación `price>=cost`. ⚠️ MoneyInput usa `onValueChange` en PWA (no `onChangeValue`).
6. **CartSheet.svelte** + `CartItemRow.svelte` + `CustomerSelectorView.svelte` (sub-vista interna `view='cart'|'customer'`).
7. **PostActionDialog.svelte** + flujo `postOrder→payOrder`.
8. **PaymentModal.svelte** + `usePayment` — CASH/TRANSFER/CREDIT, cambio, crédito+vencimiento (`daysAheadISO`), idempotencia (`client_operation_id` uuid), **override margen/stock** con diálogo de confirmación propio (reemplaza `Alert.alert` nativo).
9. **CashModal.svelte** + `useCash` — tiles, modos transfer/reconcile, destinos, `Idempotency-Key`, `ERROR_BY_CODE`.
10. **DailyTicketsModal.svelte** + `SaleDetailView.svelte` — reutilizar `TicketViewer`/`useSaleDetail`/`buildReceipt` ya portados. Compartir vía `navigator.share` con fallback a portapapeles.
11. **BarcodeScannerModal.svelte** — `BarcodeDetector` API + `getUserMedia`, fallback `@zxing/browser`, fallback final input manual.
12. **Wiring**: estados de modales, invalidaciones tras cobro (`['pos','items']`, `['sales','today']`, `['pos','cash-summary']`), responsive, safe-areas.

**Flujo de 2 fases (replicar exacto):** `createSale (POST /sales)` → ORDER → `PostActionDialog` → `processPayment (POST /payments)` → SALE.

---

## 4. Riesgos transversales y decisiones abiertas

**Decisiones que requieren confirmación del usuario:**
1. **Layout de listas** (Customers/Purchases): ¿columna única (convención PWA/Inventory) o grid 2-col responsive como pos_app? → Recomendado columna única por consistencia.
2. **Timing de validación de formularios**: pos_app valida `onChange` desde el inicio; la convención PWA (`useProductForm`) valida solo tras el primer submit (`attempted`). → Recomendado seguir convención PWA. Decidir si se unifica.
3. **Diseño de Expenses**: no hay pantalla fuente. ¿Qué 3 StatTiles, qué filtros (server vs client), qué categorías mostrar? **Validar antes de implementar.**
4. **Escáner de código de barras (POS)**: `BarcodeDetector` no existe en Safari/iOS. ¿Aceptar degradar a input manual en iOS, o añadir dependencia `@zxing/browser`?
5. **Filtrado server-side vs client-side en Expenses**: afecta paginación y exactitud de totales.

**Riesgos técnicos transversales:**
- **Query keys e invalidaciones cruzadas**: copiar verbatim de pos_app o quedan datos rancios (sobre todo POS → items/sales/cash tras vender).
- **Idempotencia = dinero real**: `Idempotency-Key` (close-cash) y `client_operation_id` (payments) deben portarse tal cual; manejar `DUPLICATE_OPERATION` como éxito. No portarlos = riesgo de doble cobro/cierre.
- **Diálogos nativos → web**: `Alert.alert` (override margen/stock) y `Share.share` (recibo) no existen en web; construir equivalentes sin romper el flujo de reintento.
- **MoneyInput prop**: `onChangeValue` (pos_app) vs `onValueChange` (PWA) → bug silencioso si se copia literal.
- **Reactividad de queryKey en svelte-query**: debe ser `$derived`/getter o no refetchea (afecta Purchases scope y POS).
- **API base/prefijo**: confirmar que `/customers`, `/purchases`, `/expenses` resuelven igual que `/inventory` (si Inventory funciona, los demás también con el mismo axios).
- **Backend cloud (pos_api)**: regla de paridad placepos↔pos_api — cualquier cambio de contrato debe replicarse en ambos fronts.

---

## 5. Por dónde empezar AHORA

### Empezar por **FASE 0 — DataLayer (4 módulos de requests + useResponsive)**.

**Por qué:**
1. **Es prerequisito duro** de los 3 módulos de pantalla pendientes con peso real (Customers, Purchases, POS). Sin estos requests no se puede avanzar ninguno.
2. **Es trabajo mecánico y de bajo riesgo**: copiar `cash/customers/pos/purchases` de pos_app reapuntando alias de import (`@/api` → `$lib/api`); los tipos son TS puro que compila sin cambios. La capa base (axios, interceptores, queryClient, stores) ya es copia fiel byte a byte.
3. **Desbloquea en cascada**: terminada FASE 0, Customers se vuelve una réplica casi automática de Inventory, y POS deja de tener el cuello de botella de su capa de datos.
4. **Esfuerzo M, alto retorno**: pocas horas de copiado que habilitan ~3000 LOC de pantallas.

**Acción inmediata concreta:** crear `src/lib/api/requests/{cash,customers,pos,purchases}/{index,types}.ts`, añadir las 4 líneas al barrel `requests/index.ts`, y correr `svelte-check` para confirmar que compila. Inmediatamente después, encadenar **FASE 1 (Customers)** como primera pantalla, por ser la migración más predecible (plantilla Inventory 1:1) y porque su contrato lo reutiliza POS.