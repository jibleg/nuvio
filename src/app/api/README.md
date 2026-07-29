# app/api/

Route handlers (endpoints HTTP). Solo orquestación: validan entrada con Zod,
delegan en use-cases del feature correspondiente y serializan la respuesta.

La lógica de negocio no vive aquí — vive en `features/<dominio>/use-cases`.
Preferir Server Actions y Server Components para el flujo interno de la app;
usar route handlers para webhooks, integraciones externas y APIs públicas.
