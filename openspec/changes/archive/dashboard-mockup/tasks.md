# Plan de Tareas: Dashboard Mockup

| ID | Status | Descripción | Archivos Objetivo |
|:---|:---|:---|:---|
| 1.1 | PENDING | Crear componente `Sidebar` con estado mobile (abrir/cerrar), links dinámicos según Rol usando `next/navigation` y estilos Tailwind premium. | `src/components/layout/Sidebar.tsx` |
| 1.2 | PENDING | Crear componente `Header` que contenga botón mobile de toggle e información superficial del usuario actual logueado. | `src/components/layout/Header.tsx` |
| 1.3 | PENDING | Crear el `DashboardLayout` principal que actúa como RSC, obtenga la sesión, y renderice el marco Shell y pase los `children`. | `src/app/dashboard/layout.tsx` |
| 2.1 | PENDING | Refactorizar la raíz de `/dashboard/page.tsx` para quitar dependencias de `lucide-react` pesadas y acoplar el diseño a las tarjetas "Premium" descritas, adaptándose al nuevo Layout general (que ahora envuelve la vista). | `src/app/dashboard/page.tsx` |
| 3.1 | PENDING | Crear páginas maqueta (placeholders funcionales) vacías para `/suministros` (farmacias/admin). | `src/app/dashboard/suministros/page.tsx` |
| 3.2 | PENDING | Crear páginas maqueta (placeholders funcionales) vacías para `/gastos`. | `src/app/dashboard/gastos/page.tsx` |
| 3.3 | PENDING | Crear panel administrativo de farmacias (solo layout vacío). | `src/app/dashboard/admin/farmacias/page.tsx` |
