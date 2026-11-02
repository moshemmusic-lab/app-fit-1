# App Fit 1 (Movyn)

App de gimnasio para iOS y Android con red social y marketplace de programas de creadores.

- Producto: [docs/PRODUCT.md](docs/PRODUCT.md)
- Arquitectura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Alcance y orden: [docs/MVP.md](docs/MVP.md)
- Diseño: [docs/DESIGN.md](docs/DESIGN.md)
- Normas y comandos: [CLAUDE.md](CLAUDE.md)

```
apps/mobile      Expo + Expo Router (iOS y Android)
apps/web         Next.js (panel de creadores y landings)
packages/shared  Tema, textos (i18n) y lógica compartida
supabase         Migraciones, datos iniciales y tests de base de datos
```

Requisitos: Node 24 y pnpm (`corepack enable pnpm`). Después: `pnpm install` y `pnpm --filter mobile start`.
