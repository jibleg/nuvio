# 🚀 Nuvio - System Prompt for Next.js 16 Development

## 📌 Contexto del Proyecto
Estás trabajando en **Nuvio**, un ERP/SaaS moderno y escalable diseñado para devolver tiempo a los empresarios mediante la gestión integrada de Facturación (CFDI 4.0), Punto de Venta (POS), Inventarios y Compras, con un fuerte enfoque en UX/UI premium, simplicidad y automatización.
 
---

## 🛠️ Stack Tecnológico
* **Framework:** Next.js 16 (App Router)
* **Lenguaje:** TypeScript (Tipado estricto, interfaces limpias, uso de Zod para validación de esquemas)
* **Estilos:** Tailwind CSS v4 (Uso intensivo de variables CSS y diseño minimalista premium)
* **Estado Global:** Zustand
* **Base de Datos / Backend:** PostgreSQL (Consultas SQL crudas mediante `pg-pool`, desacopladas y sin ORMs pesados)
* **Iconografía / Componentes:** Lucide React / Componentes atómicos (shadcn/ui o personalizaciones propias alineadas al diseño de Nuvio)

---

## 🛑 Reglas Estrictas de Codificación

1. **Código Limpio y Legible:** Escribe código pensado para humanos. Usa nombres de variables y funciones descriptivos en inglés o español (manteniendo consistencia con el dominio), evita anidamientos profundos y aplica el principio de responsabilidad única (SOLID).
2. **No ORMs:** Queda estrictamente prohibido usar Prisma, TypeORM, Drizzle o Sequelize. Toda la interacción con la base de datos debe ser mediante consultas SQL puras usando un pool de conexiones nativo (`pg`).
3. **Manejo de Errores:** Implementa bloques `try/catch` limpios, con respuestas de error estandarizadas para el frontend y logs claros en el backend.
4. **Separación de Preocupaciones (SoC):** Los Server Components deben encargarse exclusivamente de la obtención de datos (*Data Fetching*). La interactividad y el manejo de estado deben delegarse a Client Components (usando `'use client'`).
5. **Formateo y Precisión:** Respeta la exactitud de los nombres de archivos, campos y modelos de datos proporcionados. No alteres ni agregues/quites letras a los nombres existentes.

---

## 📂 Arquitectura de Archivos Requerida
El proyecto sigue una estructura modular por dominios (Domain-Driven / Feature-Sliced Design adaptado al App Router de Next.js 16). Al implementar nuevas funcionalidades, distribuye los archivos de la siguiente manera:

```text
src/
├── app/                      # Next.js App Router (Páginas, Layouts, Rutas API)
│   ├── (auth)/               # Grupo de rutas para autenticación (login, registro)
│   ├── (dashboard)/          # Grupo de rutas principales del sistema
│   │   ├── pos/              # Módulo Punto de Venta
│   │   ├── inventario/       # Módulo Inventario
│   │   └── facturacion/      # Módulo CFDI 4.0
│   └── api/                  # Endpoints RESTful / Webhooks (si aplica)
├── components/               # Componentes reutilizables compartidos
│   ├── ui/                   # Componentes atómicos (Botones, Inputs, Modales, etc.)
│   └── layout/               # Navbars, Sidebars, Footers
├── modules/                  # Lógica de Negocio por Dominio (Módulos Nuvio)
│   ├── inventory/            
│   │   ├── actions.ts        # Server Actions (Mutaciones)
│   │   ├── queries.ts        # Consultas a la BD (SQL puro vía pg-pool)
│   │   ├── types.ts          # Interfaces de TypeScript y esquemas Zod
│   │   └── components/       # Componentes específicos del módulo
│   ├── billing/              # Módulo de Facturación
│   └── pos/                  # Módulo Punto de Venta
├── lib/                      # Utilidades y configuraciones globales
│   ├── db.ts                 # Configuración y exportación del pool de conexines pg
│   └── utils.ts              # Helpers de utilidad (cn para Tailwind, formateadores, etc.)
└── store/                    # Manejo de estado global del cliente
    └── useUIStore.ts         # Tiendas de Zustand