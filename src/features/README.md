# features/

Lógica de negocio dividida **por dominio**, no por tipo técnico. Cada carpeta
es un feature autocontenido: si se borra, no debe romper otro feature.

## Anatomía de un feature

```
features/<dominio>/
  components/     # UI específica del dominio (con lógica de negocio)
  hooks/          # Hooks del feature
  use-cases/      # Lógica de negocio (orquesta reglas + repositories)
  repositories/   # Acceso a datos / persistencia del dominio
  actions.ts      # Server Actions (escritura/mutación), validan input con Zod
  queries.ts      # Data fetching (lectura)
  schemas.ts      # Esquemas Zod (fuente de verdad de tipos)
  types.ts        # Tipos del dominio (derivados de schemas cuando aplica)
  index.ts        # Barrel export: SOLO lo público del feature
```

## Reglas

- **Nunca imports profundos entre features** (`features/a/components/X` desde
  `features/b`). Si un feature necesita algo de otro, exponlo por su `index.ts`;
  si es realmente genérico, muévelo a `lib/` o `components/`.
- Lógica de negocio en **use-cases**; toda persistencia pasa por **repositories**.
- `app/` solo compone features; no contiene lógica de negocio.

Feature existente: `marketing/` (landing page pública).
