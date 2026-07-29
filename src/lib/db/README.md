# lib/db/

Cliente de base de datos y acceso de bajo nivel. La BD es `nuvio` (PostgreSQL,
localhost:5470 en desarrollo).

El cliente concreto (ORM/driver) se define al construir el primer módulo del
sistema. La conexión se toma de `DATABASE_URL` validada en `@/lib/env`.

Regla: los **repositories** de cada feature consumen el cliente de aquí; los
componentes y use-cases nunca hablan con la BD directamente.
