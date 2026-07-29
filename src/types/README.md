# types/

Tipos compartidos **globalmente** entre features. Mantener al mínimo: los tipos
de un dominio viven en `features/<dominio>/types.ts` y se derivan de sus
esquemas Zod. Solo lo verdaderamente transversal entra aquí.
