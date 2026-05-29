# placepos_pwa_app

Versión **web (PWA)** de `pos_app`: réplica fiel (diseño + lógica) construida con
**SvelteKit 2 + Svelte 5 + Tailwind + shadcn-svelte**. App de Punto de Venta
**solo informativa** que consume el backend `pos_api` por HTTP.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5180
```

Configura la URL del backend en `.env`:

```bash
PUBLIC_API_URL=http://localhost:3010   # o el túnel ngrok en dev
```

## Scripts

- `npm run dev` — dev server (Vite)
- `npm run build` — build SPA + PWA (`adapter-static`)
- `npm run preview` — sirve el build
- `npm run check` — typecheck (`svelte-check`)
- `npm run lint` — ESLint

Ver `CLAUDE.md` para la arquitectura y las reglas del proyecto.
