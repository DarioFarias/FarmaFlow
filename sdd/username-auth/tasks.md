# Tasks: username-auth

## Phase 1: Foundation

### 1.1 Agregar campo username al User model (src/models/User.ts)

- [x] **1.1.1** Agregar campo `username` al schema con:
  - `type: String`
  - `required: [true, 'El nombre de usuario es obligatorio']`
  - `unique: true`
  - `lowercase: true`
  - `trim: true`
  - `minlength: [3, 'El username debe tener al menos 3 caracteres']`
  - `maxlength: [30, 'El username no puede superar 30 caracteres']`
- [x] **1.1.2** Agregar índice único para username
- [x] **1.1.3** Verificar que el campo email siga siendo opcional (sparse: true)

### 1.2 Agregar username al IUser interface (src/types/index.ts)

- [x] **1.2.1** Agregar `username: string` a la interfaz IUser
- [x] **1.2.2** Actualizar documentación del campo

## Phase 2: Core Implementation

### 2.1 Modificar authorize() en src/lib/auth.ts

- [x] **2.1.1** Cambiar credential de `email` a `username`
- [x] **2.1.2** Modificar query de búsqueda de `email` a `username`
- [x] **2.1.3** Aplicar `.toLowerCase()` al username recibido
- [x] **2.1.4** Validar que username no esté vacío

### 2.2 Agregar fallback búsqueda por email para usuarios legacy

- [x] **2.2.1** Si no se encuentra usuario por username, hacer fallback a búsqueda por email
- [x] **2.2.2** La query fallback debe buscar: `email: credentials.username.toLowerCase()`
- [x] **2.2.3** Solo aplicar fallback si el campo username está vacío o no existe en el documento

**Nota Técnica**: La query debe ser:
```javascript
// Intentar primero por username
let user = await User.findOne({
  username: credentials.username.toLowerCase(),
  isActive: true,
}).select('+password')

// Fallback legacy: buscar por email si no se encontró por username
if (!user) {
  user = await User.findOne({
    email: credentials.username.toLowerCase(),
    isActive: true,
  }).select('+password')
}
```

## Phase 3: UI/Integration

### 3.1 Actualizar LoginForm (src/app/login/LoginForm.tsx)

- [x] **3.1.1** Cambiar schema de `email` a `username`:
  ```typescript
  const loginSchema = z.object({
    username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  })
  ```
- [x] **3.1.2** Actualizar label de "Correo electrónico" a "Nombre de usuario"
- [x] **3.1.3** Actualizar placeholder a "usuario123" o similar
- [x] **3.1.4** Cambiar type de `email` a `text` (o remove type attribute)
- [x] **3.1.5** Actualizar mensajes de error
- [x] **3.1.6** Actualizar `signIn` call para enviar `username` en lugar de `email`:
  ```typescript
  const result = await signIn('credentials', {
    username: data.username.toLowerCase(),
    password: data.password,
    redirect: false,
  })
  ```
- [x] **3.1.7** Actualizar mensaje de error de credenciales a "Credenciales incorrectas. Verifica tu usuario y contraseña."

### 3.2 Verificar RegisterForm si existe

- [x] **3.2.1** Buscar archivo RegisterForm.tsx
- [x] **3.2.2** Si existe, verificar que no necesite cambios (el registro por ahora no incluye username)

## Phase 4: Migration

### 4.1 Crear script de migración para usuarios existentes

- [x] **4.1.1** Crear archivo `scripts/add-username-to-users.ts`
- [x] **4.1.2** Script debe:
  - Conectar a MongoDB
  - Buscar usuarios donde `username` no existe o está vacío
  - Derivar username desde email: tomar parte antes de `@` y sanitizar
  - Manejar conflictos: si el username derivado ya existe, agregar sufijo numérico
  - Actualizar documentos uno por uno (usa await save por validación de Mongoose)
- [x] **4.1.3** Agregar logging para tracking

**Ejemplo de lógica de derivación:**
```typescript
// Derivar username desde email: "john.doe@company.com" -> "john.doe"
const derivedUsername = user.email.split('@')[0].toLowerCase()

// Verificar si ya existe, si existe, agregar sufijo
let username = derivedUsername
let counter = 1
while (await User.findOne({ username })) {
  username = `${derivedUsername}${counter}`
  counter++
}
```

### 4.2 Ejecutar migración

- [ ] **4.2.1** Ejecutar script en desarrollo primero
- [ ] **4.2.2** Verificar que usuarios legacy tengan username derivado
- [ ] **4.2.3** Si es necesario, ejecutar en producción

## Phase 5: Verification

### 5.1 Test login con username nuevo

- [ ] **5.1.1** Crear nuevo usuario con username via registro o directamente en DB
- [ ] **5.1.2** Intentar login con username y password
- [ ] **5.1.3** Verificar que el login sea exitoso

### 5.2 Test login legacy con email

- [ ] **5.2.1** Usar un usuario existente (sin username en DB pero con email)
- [ ] **5.2.2** Intentar login usando el email como username
- [ ] **5.2.3** Verificar que el fallback funcione y el login sea exitoso

### 5.3 Verificar build

- [ ] **5.3.1** Ejecutar `npm run build` o `next build`
- [ ] **5.3.2** Verificar que no haya errores de TypeScript
- [ ] **5.3.3** Verificar que no haya errores de lint

## Dependencias

- **Bloqueante**: Phase 1 debe completarse antes de Phase 2
- **Bloqueante**: Phase 2 debe completarse antes de Phase 3
- **No bloqueante**: Phase 4 (migración) puede ejecutarse en paralelo o después de Phase 3
- **Orden**: Phase 5 siempre al final

## Notas Adicionales

- El campo email ya es opcional (`sparse: true`) - mantener así
- El sistema de auth usa JWT con maxAge de 30 días - no modificar
- El password usa bcrypt - no modificar
- Los tipos TypeScript deben actualizarse consistentemente

---

## Progreso: Phase 2 Completada ✅

**Fecha**: 2026-04-15

**Cambios realizados**:

1. **src/lib/auth.ts** - authorize() modificado:
   - Búsqueda por username primero
   - Fallback a búsqueda por email para usuarios legacy
   - Input normalizado con `.toLowerCase().trim()`
   - Retorna `username: user.username || null` para backwards compatibility

2. **src/lib/auth.ts** - callbacks actualizados:
   - `jwt` callback: persiste `token.username`
   - `session` callback: expone `session.user.username`

3. **src/types/next-auth.d.ts** - Extensiones de tipos actualizadas:
   - `Session.user.username?: string | null`
   - `User.username?: string | null`
   - `JWT.username?: string | null`

**Estado**: Phase 2 completada ✅ - Listo para Phase 3 o Phase 4
