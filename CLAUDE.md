# CLAUDE.md

Guía para Claude Code cuando trabaje en este repositorio.

## Overview

**placepos_pwa_app** es la **versión web (PWA)** de `pos_app`: una **réplica fiel
y exacta** —diseño, estructura modular y lógica— construida desde cero con
**SvelteKit 2 + Svelte 5 (runes) + Tailwind + shadcn-svelte**. Es una app de
Punto de Venta **solo informativa** que se conecta vía HTTP al backend externo
`pos_api` para consultar ventas, clientes, inventario y demás datos en tiempo
real. **No hay base de datos local ni lógica de escritura compleja**: la app
consulta, no opera.

Referencia 1:1 del diseño y la lógica: `pos_app`
(`/Volumes/KiKe 1/development/pos_app`, Expo + React Native). El backend es
`pos_api` (`/Volumes/KiKe 1/development/pos_api`).

> **Regla de paridad:** cualquier cambio de comportamiento debe mantener la
> equivalencia con `pos_app`. Si `pos_app` cambia su lógica, esta PWA debe
> reflejarla; si esta PWA descubre un bug de lógica, evaluar replicarlo en
> `pos_app`. El diseño se adapta a la web (CSS, hover, foco) pero la **identidad
> visual y el flujo deben ser los mismos**.

## Commands

```bash
npm run dev          # Dev server de Vite (http://localhost:5180)
npm run build        # Build de producción (adapter-static, SPA + PWA)
npm run preview      # Sirve el build
npm run check        # svelte-check (typecheck de .svelte y .ts)
npm run lint         # ESLint
```

> El proyecto usa **npm** (hay `package-lock.json`). No hay test runner configurado.

## Arquitectura

### Stack y equivalencias con pos_app

| pos_app (Expo / RN)            | placepos_pwa_app (SvelteKit web)             |
| ------------------------------ | -------------------------------------------- |
| Expo Router (`app/`)           | SvelteKit `src/routes/` (file-based)         |
| Grupos `(auth)` / `(app)`      | Grupos de ruta `(auth)` / `(app)`            |
| NativeWind v4 + `global.css`   | Tailwind v3 + `src/app.css` (mismos tokens)  |
| Zustand stores                 | Runes en `.svelte.ts` (`auth`, `theme`)      |
| `@tanstack/react-query`        | `@tanstack/svelte-query`                     |
| `react-hook-form` + `zod`      | Form con runes + `zod` (`safeParse`)         |
| `axios` + interceptors         | `axios` + interceptors (idéntico)            |
| `expo-secure-store` (token)    | `localStorage` (wrapper `api/storage.ts`)    |
| `lucide-react-native`          | `@lucide/svelte`                             |
| Reanimated                     | Transiciones CSS / animaciones Tailwind      |
| `expo-glass-effect` (liquid)   | No existe en web → barra clásica (CSS glass) |
| `react-native-view-shot`       | (pendiente) captura DOM para compartir imagen|
| `expo-print` / `expo-sharing`  | (pendiente) `window.print()` / Web Share API |

### Estructura de carpetas

```
placepos_pwa_app/
├── src/
│   ├── routes/                      # SvelteKit (file-based routing)
│   │   ├── +layout.svelte           # Root: QueryClientProvider + AuthGate
│   │   ├── +layout.ts               # ssr=false, prerender=false (SPA)
│   │   ├── (auth)/login/+page.svelte
│   │   ├── (app)/+layout.svelte     # Shell autenticado: AppHeader + AppTabBar
│   │   ├── (app)/+page.svelte       # Dashboard (Inicio)
│   │   ├── (app)/reportes/ ...      # Resto de pestañas
│   │   └── pos/+page.svelte         # POS inmersivo (fuera del grupo (app))
│   └── lib/
│       ├── api/
│       │   ├── config.ts            # Singleton axios + interceptors (JWT + 401)
│       │   ├── queryClient.ts       # QueryClient de svelte-query
│       │   ├── storage.ts           # Token en localStorage (wrapper)
│       │   ├── session.ts           # Cierre de sesión centralizado
│       │   └── requests/<entity>/   # { index.ts (HTTP), types.ts (DTOs) }
│       ├── components/              # UI globales (AppHeader, AppTabBar, ...)
│       ├── constants/               # env, etc.
│       ├── hooks/                   # Hooks globales (useProfile, useLogout, ...)
│       ├── modules/                 # Features por dominio (espejo de pos_app)
│       │   └── <Feature>/pages/<Page>/
│       │       ├── <Page>.svelte    # Vista
│       │       ├── components/      # Componentes locales
│       │       ├── hooks/           # Lógica (forms, mutations, queries)
│       │       └── schemas/         # Schemas zod
│       ├── stores/                  # Runes globales (auth.svelte.ts, theme.svelte.ts)
│       ├── types/                   # Tipos compartidos
│       └── utils/                   # Helpers (numbers, dates, errors, id, ...)
├── src/app.css                      # Tokens de tema (idénticos a pos_app)
├── tailwind.config.ts
└── static/                          # manifest PWA, iconos, robots
```

### Patrón de rutas

Las rutas en `src/routes/` son **delgadas**: solo registran la ruta y renderizan
el componente del módulo. Toda la lógica vive en `src/lib/modules/`.

```svelte
<!-- src/routes/(auth)/login/+page.svelte -->
<script lang="ts">
    import Login from '$lib/modules/Authentication/pages/Login/Login.svelte'
</script>
<Login />
```

Los grupos `(auth)` / `(app)` **no aparecen en la URL**. El `AuthGate` detecta la
zona por pathname (`/login` = auth) en vez de por nombre de grupo.

### Comunicación con el backend

Toda la data se consume por HTTP vía el singleton de `src/lib/api/config.ts`. El
interceptor inyecta el JWT en cada request; el de response captura 401 (excepto
en endpoints de auth) y limpia la sesión. **Token:** `localStorage` vía
`src/lib/api/storage.ts`. Nunca tocar `localStorage` fuera de ese wrapper.

### State management

- **Runes en `.svelte.ts`** para estado de cliente (auth, theme). Se exporta una
  instancia singleton (`export const auth = new AuthStore()`); leer `auth.token`
  en un componente es reactivo, desde código imperativo es un snapshot.
- **svelte-query** para estado de servidor (`refetchOnWindowFocus: false`,
  `retry` solo en 5xx/red, `staleTime: 30s`). `createQuery`/`createMutation` se
  llaman **durante la inicialización** del componente (o de un hook llamado ahí).
- **Context de Svelte** solo si un módulo necesita compartir estado entre hijos.

### Forms

Form ligero con runes + `zod` (`schema.safeParse(form)`), sin dependencia extra.
El schema vive en `modules/<Feature>/pages/<Page>/schemas/`. Ver el patrón en
`modules/Authentication/pages/Login/hooks/useLoginForm.svelte.ts`.

### Estilos

Tailwind v3 con tokens de color en `src/app.css` (variables HSL, idénticas a
`pos_app`) expuestas en `tailwind.config.ts` como
`hsl(var(--token) / <alpha-value>)`. **Nunca hardcodear hex** — usar las clases
tematizadas (`bg-primary`, `text-foreground`, `border-border`, ...). Para color
puntual fuera de paleta (gradientes, glows) se admite `hsl()`/`hsla()` inline en
`style`, igual que pos_app.

Iconos: `@lucide/svelte` (el color va por prop `color`, no por className SVG).

Primitivos: `shadcn-svelte` en `$lib/components/ui` cuando aporte (no reescribir
lo que ya existe a mano si shadcn lo cubre mejor).

## Authentication

- `POST /auth/user` con `{ username, password }` → `{ success, payload: { access_token, user } }`.
- El token se persiste en `localStorage` (`placepos_pwa.auth_token`).
- `AuthGate` (`src/lib/components/AuthGate.svelte`) hidrata el token al arrancar y
  redirige entre `/login` y `/` según el estado.
- Errores típicos por campo: `USER_NOT_FOUND`, `INVALID_PASSWORD`, `LOGIN_DISABLED`.

## Code Standards

- **No `any` en TypeScript.** Tipar con `type`/`interface`.
- **Funciones ~20-30 líneas**, máximo 3 argumentos (si no, objeto de config).
- **Componentes ~100-150 líneas.** Si crece, separar en subcomponentes o extraer
  lógica a hooks (`.svelte.ts`).
- **No business logic en `components/`.** Vive en hooks o utils.
- **No instalar librerías nuevas sin preguntar primero.**
- **No renombrar ni reestructurar archivos sin autorización explícita.**
- **Comentar solo el "porqué"**, no el "qué".
- **Imports con alias** `$lib/` (= `src/lib`) y `@/` (= `src`). No rutas relativas profundas.
- **Svelte 5 runes siempre**: `$props`, `$state`, `$derived`, `$effect`, `$bindable`.
  Nada de `export let` ni `$:`.

## Diseño (Emil Design Engineering)

El skill `emil-design-eng` (`.claude/skills/emil-design-eng/SKILL.md`) aplica a
toda la UI. Reglas que aplican siempre:

- Animaciones de UI bajo 300ms y con `ease-out` (curvas fuertes, nunca `ease-in`).
  Hay utilidades en tailwind: `ease-out-strong`, `ease-in-out-strong`, `ease-drawer`.
- Feedback al presionar: `active:scale-[0.97]` con transición corta (`PressableScale`).
- Nunca animar desde `scale(0)`; empezar desde `0.95` con `opacity: 0`.
- Respetar `prefers-reduced-motion` (ya hay un override global en `app.css`).
- Solo animar `transform` y `opacity` (GPU). Preferir transiciones CSS a keyframes
  para UI interrumpible.
- `transform-origin` consciente del origen en popovers; modales centrados.

## Revisión obligatoria con subagente

Tras cualquier implementación o ajuste no trivial — antes de declarar la tarea
completada — lanzar `react-frontend-expert` (o `fullstack-reviewer` si toca varias
capas) para auditar. El subagente NO escribe código; solo audita y devuelve
hallazgos priorizados (BLOQUEANTE / IMPORTANTE / MENOR). La tarea no se considera
completa hasta vaciar los bloqueantes. NO aplica a: cambios cosméticos, renombres
locales, typos.

## Commits

Mensajes en **español**, generales, concisos (~72 caracteres). Stagear con
`git add .` salvo indicación contraria. **Nunca** añadir `Co-Authored-By`. **Nunca**
cambiar de rama para commitear salvo orden explícita.
