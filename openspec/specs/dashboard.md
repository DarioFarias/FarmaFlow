# Especificaciones: Dashboard Core

## 1. Sistema de Layout Base (`/dashboard`)
- **REQ-001**: El sistema DEBE proveer un contenedor general para todas las rutas hijas de `/dashboard` que incluya un `Sidebar` a la izquierda y un `Header` superior.
- **REQ-002**: El `Sidebar` DEBE ser responsivo (ocultable en pantallas pequeñas y con botón de hamburguesa en el Header).
- **REQ-003**: El sistema DEBE inyectar la información de sesión actual y el ROL del usuario a los componentes de cliente del Layout sin romper los límites Server/Client.

## 2. Navegación Basada en Roles
- **REQ-004**: Si el usuario tiene rol `ADMIN`, el Sidebar DEBE mostrar enlaces a: "Dashboard" (`/dashboard`), "Pedidos a Despachar" (`/dashboard/suministros`), "Auditoría de Gastos" (`/dashboard/gastos`), "Gestión de Farmacias" (`/dashboard/admin/farmacias`).
- **REQ-005**: Si el usuario tiene rol `PHARMACY`, el Sidebar DEBE mostrar enlaces a: "Inicio" (`/dashboard`), "Mis Pedidos" (`/dashboard/suministros`), "Mis Gastos" (`/dashboard/gastos`).
- **REQ-006**: La ruta actualmente activa DEBE estar resaltada visualmente en el menú.

## Escenarios (Gherkin)

```gherkin
Feature: Sidebar Navigation by Role

  Scenario: Un usuario Farmacia entra al sistema
    Given que el usuario activo tiene rol "PHARMACY"
    When acceda a la url "/dashboard"
    Then el Sidebar debería renderizar los links "Mis Pedidos" y "Mis Gastos"
    And los enlaces exclusivos de administrador NO DEBEN estar en el DOM

  Scenario: Indicador de ruta activa
    Given que el usuario está en la página "/dashboard/gastos"
    When visualiza el menủ lateral de la izquierda
    Then el enlace de "Gastos" debe tener un fondo primario con texto destacado
    And los demás enlaces deben tener color neutral
```
