# lib/auth/

Configuración transversal de autenticación y sesión (no lógica de un feature).
Aquí vive el setup de auth y los helpers de sesión que cualquier feature puede
consumir.

El modelo de usuarios/roles/permisos (RBAC) del sistema se implementa en su
propio feature; esta carpeta solo expone la infraestructura de auth.
