# FarmaFlow

Sistema de gestión centralizada para supervisores y farmacias. Reemplaza la coordinación por WhatsApp centralizando pedidos de suministros y control de gastos operativos.

## Stack

- **Next.js 14** (App Router) + **TypeScript** estricto
- **MongoDB Atlas** + **Mongoose**
- **NextAuth.js** (JWT RBAC: `ADMIN` / `PHARMACY`)
- **Cloudinary** (fotos de facturas)
- **Tailwind CSS** (Mobile-First)
- **Zod** (validación isomórfica)

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# 3. Correr en desarrollo
npm run dev
```

## Estructura del proyecto

```
farmaflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── supplies/
│   │   │   │   ├── route.ts          ← GET (lista) / POST (crear)
│   │   │   │   └── [id]/route.ts     ← GET / PATCH (cambiar estado)
│   │   │   └── expenses/
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            ← Sidebar + main wrapper
│   │   │   ├── page.tsx              ← Home del dashboard
│   │   │   ├── suministros/          ← Lista y detalle de pedidos
│   │   │   ├── gastos/               ← Lista y detalle de gastos
│   │   │   └── farmacias/            ← Solo ADMIN
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← Redirect → /dashboard
│   ├── components/
│   │   ├── Providers.tsx             ← SessionProvider + Toaster
│   │   └── Sidebar.tsx               ← Sidebar (desktop) + Bottom Nav (mobile)
│   ├── lib/
│   │   ├── auth.ts                   ← NextAuth options + RBAC helpers
│   │   ├── cloudinary.ts             ← Config + helpers upload/delete
│   │   ├── mongodb.ts                ← Singleton connection
│   │   └── validations.ts            ← Schemas Zod
│   ├── middleware.ts                  ← Edge RBAC middleware
│   ├── models/
│   │   ├── Expense.ts
│   │   ├── SupplyRequest.ts
│   │   └── User.ts
│   └── types/
│       ├── index.ts                  ← Enums + Interfaces TS
│       └── next-auth.d.ts            ← Augmentación de tipos NextAuth
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Máquina de estados — Suministros

```
REQUESTED → VALIDATING → AUTHORIZED → SHIPPED → RECEIVED
                      ↘ REJECTED
```

| Estado       | Quién lo activa  |
|--------------|-----------------|
| REQUESTED    | Farmacia (POST)  |
| VALIDATING   | Supervisor       |
| AUTHORIZED   | Supervisor       |
| REJECTED     | Supervisor       |
| SHIPPED      | Supervisor       |
| RECEIVED     | Farmacia         |

## Roles

| Acción                    | ADMIN | PHARMACY |
|---------------------------|-------|----------|
| Ver todos los pedidos     | ✅    | ❌       |
| Ver propios pedidos       | ✅    | ✅       |
| Crear pedido              | ❌    | ✅       |
| Autorizar / Rechazar      | ✅    | ❌       |
| Confirmar recepción       | ❌    | ✅       |
| Aprobar gasto             | ✅    | ❌       |
| Registrar gasto           | ❌    | ✅       |
| Ver todas las farmacias   | ✅    | ❌       |
