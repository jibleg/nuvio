/** Header interno donde el proxy publica el slug del tenant (subdominio). */
export const TENANT_HEADER = "x-nuvio-tenant";

/** Subdominios que NO representan a un cliente (root/marketing/infra). */
export const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"]);
