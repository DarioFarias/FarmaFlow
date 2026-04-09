# Diseño Técnico: Dashboard Layouut

## Decisiones de Arquitectura

1. **Patrón de Componentes Compuestos (Composition Pattern)**
   En lugar de pasar 50 props al layout, el `Layout` (Server Component) obtendrá el `session.user` e inyectará los datos esenciales (`role`, `pharmacyName`) al componente `Sidebar` (Client Component). Esto evita "Boolean Prop Proliferation".

2. **Manejo del Estado del Menú (ResponsiveToggle)**
   El `Sidebar` será un `'use client'` porque tiene estado (estado `isOpen` para pantallas móviles). Para evitar hidrataciones pesadas, usaremos clases responsivas puras de Tailwind (`hidden md:flex`) donde se pueda, requiriendo el estado solo para interactividad de botón de hamburguesa.

3. **Estructura de Carpetas de Componentes**
   ```text
   src/
    ├── components/
    │    └── layout/
    │         ├── Sidebar.tsx
    │         ├── Header.tsx
    │         └── DashboardShell.tsx
   ```

4. **Patrón de Íconos Unificado**
   Toda iconografía se sacará desde `lucide-react`.

5. **Server Components (RSC) Boundaries**
   `src/app/dashboard/layout.tsx` -> NO llevará 'use client'. Aquí se extrae la sesión y se pasa a los componentes UI de cliente.
