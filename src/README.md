# Arquitectura de Nuvio

Arquitectura **modular por dominio/feature** (App Router). Regla base: el
dominio manda sobre la tecnología y el código debe leerse como una historia del
negocio. Convenciones completas en `assets/prompts/nuvio-nextjs16-prompt.md`.

```
src/
  app/                  # Rutas. Solo orquestación: layouts, pages, route handlers.
    (marketing)/        # Landing pública (feature: marketing)
    (dashboard)/        # Área autenticada del sistema
    api/                # Route handlers (webhooks, integraciones, APIs públicas)
    layout.tsx          # Root layout (fuentes, tema, metadata global)
    globals.css

  features/             # Lógica de negocio por dominio (autocontenida)
    marketing/          # Secciones del landing

  components/
    ui/                 # Primitivas genéricas (Button, Badge, Logo, ...)
    layout/             # Header, Sidebar, Footer, contenedores
    providers/          # Providers de cliente (TanStack Query, ...)

  lib/                  # Infraestructura transversal
    db/                 # Cliente de base de datos
    auth/               # Configuración de autenticación
    env.ts              # Validación de variables de entorno (Zod)
    cn.ts               # Utilidad de className
    motion.ts           # Presets de animación

  hooks/                # Hooks genéricos reutilizables
  types/                # Tipos compartidos globalmente
  config/               # Constantes y configuración estática de la app
```

## Stack de patrones

- Validación: **Zod** (fuente de verdad de tipos).
- Formularios: **React Hook Form + Zod**.
- Estado local: `useState`. Estado de feature: **Zustand**.
- Estado de servidor: **TanStack Query**.
- Lógica de negocio en **use-cases**; persistencia en **repositories**.
- Imports con alias `@/` → `src/`. Nunca imports profundos entre features.
