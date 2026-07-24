# Nuvio — Landing Page

> _Dedícate a hacer crecer tu negocio. Nosotros te ayudamos con la operación._

Landing page premium y totalmente animado para **Nuvio**, la plataforma que reúne
facturación CFDI 4.0, punto de venta, inventario y compras en un solo lugar.
Idea rectora de marca: **"Nuvio devuelve tiempo para crecer."**

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design system CSS-first en `app/globals.css`)
- **Framer Motion** para todas las animaciones (reveals, orquestación, flujos)
- **lucide-react** para iconografía

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción (type-check incluido)
npm start        # sirve el build
```

## Estructura

```
app/
  layout.tsx        Fuentes (Sora + Inter), metadata / SEO
  page.tsx          Ensamble de secciones
  globals.css       Design system: colores, gradientes, keyframes, utilidades
components/
  Nav, Hero, HeroVisual, ValuesStrip, Story, Modules, ModulePreview,
  Connected, Productivity, Roadmap, ForPeople, Testimonial, Manifesto,
  FinalCTA, Footer, ScrollProgress
  ui/               Primitivas: Button, Badge, Logo, Reveal, SectionHeading
lib/
  motion.ts         Variantes y config de viewport reutilizables
  cn.ts             Utilidad de className
```

## Sistema de diseño

- **Paleta oficial (teal/cian):** `#1A9CAB · #39B5C0 · #58CED5 · #76E6EA · #95FFFF`,
  extendida con teales profundos (`brand-700…950`) tomados del logo para texto y CTAs.
- **Aurora:** cian brillante para destellos y acentos.
- **Ámbar (funcional):** solo para alertas de stock bajo. Todo lo demás es teal.
- Tipografía: **Sora** (display) + **Inter** (texto).
- **Modo oscuro:** clase `.dark` sobre `<html>`, tokens de superficie que se invierten
  (`--color-paper/surface/cloud/ink/line`), script anti-FOUC en `layout.tsx` y toggle
  animado sol/luna ([ThemeToggle](components/ui/ThemeToggle.tsx)). Persiste en
  `localStorage` y respeta `prefers-color-scheme`. Se puede forzar con `?theme=dark|light`.
- Movimiento: `prefers-reduced-motion` respetado globalmente.

## Logos

- [components/ui/Logo.tsx](components/ui/Logo.tsx) reconstruye la "N" como **SVG
  theme-aware** (se adapta a claro/oscuro) — variante `full` (con wordmark "nuvio")
  en el Nav y `icon` disponible para usos compactos.
- Los PNG originales viven en [public/brand/](public/brand/) y se usan como favicon,
  apple-touch icon e imagen Open Graph.

Los CTAs (`Comenzar gratis`, `Crear mi cuenta gratuita`, etc.) son placeholders
listos para conectar al flujo de registro / demo cuando exista la app.
