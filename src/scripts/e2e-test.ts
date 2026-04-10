/**
 * Script de pruebas E2E de la API de FarmaFlow
 * Prueba todos los flujos sin depender de un browser
 */
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const BASE_URL = 'http://localhost:3000'

// ─── Helpers ───────────────────────────────────────────────────────────────

async function login(email: string, password: string): Promise<string> {
  // NextAuth uses CSRF token + credentials flow
  // First get the CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`)
  const csrfData = await csrfRes.json()
  const csrfToken = csrfData.csrfToken

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      redirect: 'false',
      json: 'true',
    }),
    redirect: 'manual',
  })

  // Extract the session token from cookies
  const setCookieHeader = loginRes.headers.get('set-cookie')
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [setCookieHeader || '']
  const sessionCookie = cookies
    .flat()
    .join('; ')
    .match(/(next-auth\.session-token=[^;]+)/)?.[1] || ''

  return sessionCookie
}

async function apiCall(method: string, path: string, sessionCookie: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

// ─── Test Runner ────────────────────────────────────────────────────────────

const results: { test: string; pass: boolean; detail: string }[] = []

function assert(test: string, condition: boolean, detail: string) {
  results.push({ test, pass: condition, detail })
  const icon = condition ? '✅' : '❌'
  console.log(`${icon} ${test}: ${detail}`)
}

// ─── Main Tests ─────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n' + '═'.repeat(60))
  console.log(' FarmaFlow E2E API Tests')
  console.log('═'.repeat(60) + '\n')

  // ─── 1. Login Tests ────────────────────────────────────────────────────────
  console.log('\n📋 FASE 1: Login de Usuarios\n')

  const superAdminCookie = await login('dajfarias@gmail.com', 'FarmaFlow2024!')
  assert('Login Super Admin', superAdminCookie.length > 0, superAdminCookie.length > 0 ? 'Cookie obtenida' : 'Sin cookie (login fallido)')

  const supervisorCookie = await login('supervisor1@farmaflow.com', 'Supervisor123!')
  assert('Login Supervisor', supervisorCookie.length > 0, supervisorCookie.length > 0 ? 'Cookie obtenida' : 'Sin cookie')

  const pharmacyCookie = await login('farmacia1@farmaflow.com', 'Farmacia123!')
  assert('Login Farmacia', pharmacyCookie.length > 0, pharmacyCookie.length > 0 ? 'Cookie obtenida' : 'Sin cookie')

  // ─── 2. Usuario Panel (Super Admin) ─────────────────────────────────────────
  console.log('\n📋 FASE 2: Panel de Usuarios (Super Admin)\n')

  const usersRes = await apiCall('GET', '/api/admin/users', superAdminCookie)
  assert('SA: GET /api/admin/users', usersRes.status === 200, `Status ${usersRes.status}, ${Array.isArray(usersRes.data) ? usersRes.data.length + ' usuarios' : JSON.stringify(usersRes.data)}`)

  const superAdminBlocked = await apiCall('GET', '/api/admin/users', supervisorCookie)
  assert('Supervisor NO accede a /api/admin/users', superAdminBlocked.status === 403, `Status ${superAdminBlocked.status} (esperado 403)`)

  const pharmacyBlocked = await apiCall('GET', '/api/admin/users', pharmacyCookie)
  assert('Farmacia NO accede a /api/admin/users', pharmacyBlocked.status === 403, `Status ${pharmacyBlocked.status} (esperado 403)`)

  // Get a pharmacy user ID to test role change
  let pharmacyUserId = ''
  if (Array.isArray(usersRes.data)) {
    const pharmacy = usersRes.data.find((u: any) => u.role === 'PHARMACY')
    if (pharmacy) pharmacyUserId = pharmacy._id
  }

  if (pharmacyUserId) {
    const roleUpdate = await apiCall('PATCH', `/api/admin/users/${pharmacyUserId}`, superAdminCookie, { role: 'ADMIN' })
    assert('SA: Cambiar rol de usuario', roleUpdate.status === 200, `Status ${roleUpdate.status}`)

    // Revert
    const revertRole = await apiCall('PATCH', `/api/admin/users/${pharmacyUserId}`, superAdminCookie, { role: 'PHARMACY' })
    assert('SA: Revertir rol', revertRole.status === 200, `Status ${revertRole.status}`)

    const toggleActive = await apiCall('PATCH', `/api/admin/users/${pharmacyUserId}`, superAdminCookie, { isActive: false })
    assert('SA: Desactivar usuario', toggleActive.status === 200, `Status ${toggleActive.status}`)

    const reactivate = await apiCall('PATCH', `/api/admin/users/${pharmacyUserId}`, superAdminCookie, { isActive: true })
    assert('SA: Reactivar usuario', reactivate.status === 200, `Status ${reactivate.status}`)
  } else {
    console.log('⚠️  No se encontró usuario farmacia para probar cambio de rol')
  }

  // ─── 3. Crear Pedidos desde Farmacia ──────────────────────────────────────
  console.log('\n📋 FASE 3: Pedidos de Suministros (Farmacia)\n')

  const newSupply = await apiCall('POST', '/api/supplies', pharmacyCookie, {
    items: [
      { name: 'Ibuprofeno 400mg', category: 'OTHER', quantity: 50, unit: 'unidades', notes: 'Urgente' },
      { name: 'Paracetamol 500mg', category: 'OTHER', quantity: 100, unit: 'tabletas' }
    ],
    priority: 'HIGH',
    notes: 'Pedido de prueba E2E - Stock crítico',
  })
  assert('Farmacia: Crear pedido suministros', newSupply.status === 201, `Status ${newSupply.status}, ${JSON.stringify(newSupply.data).substring(0, 100)}`)

  const supplyId = newSupply.data?._id || newSupply.data?.data?._id

  // Farmacia puede leer sus propios pedidos
  const mySupplies = await apiCall('GET', '/api/supplies', pharmacyCookie)
  assert('Farmacia: Leer sus pedidos', mySupplies.status === 200, `Status ${mySupplies.status}`)

  // ─── 4. Auditoría por Supervisor ────────────────────────────────────────────
  console.log('\n📋 FASE 4: Auditoría de Pedidos (Supervisor)\n')

  const allSupplies = await apiCall('GET', '/api/supplies', supervisorCookie)
  assert('Supervisor: Ver TODOS los pedidos', allSupplies.status === 200, `Status ${allSupplies.status}, ${Array.isArray(allSupplies.data) ? allSupplies.data.length + ' pedidos' : 'sin array'}`)

  if (supplyId) {
    const authorize = await apiCall('PATCH', `/api/supplies/${supplyId}`, supervisorCookie, {
      status: 'AUTHORIZED',
      comment: 'Pedido aprobado por Supervisor 1',
    })
    assert('Supervisor: Autorizar pedido', authorize.status === 200, `Status ${authorize.status}`)

    // Intentar autorizar sin permiso (farmacia)
    const farmaciaAuth = await apiCall('PATCH', `/api/supplies/${supplyId}`, pharmacyCookie, {
      status: 'REJECTED',
    })
    assert('Farmacia NO puede cambiar estado de pedido', farmaciaAuth.status === 403, `Status ${farmaciaAuth.status} (esperado 403)`)

    const ship = await apiCall('PATCH', `/api/supplies/${supplyId}`, supervisorCookie, {
      status: 'SHIPPED',
      comment: 'Enviado el día de hoy',
    })
    assert('Supervisor: Marcar como enviado', ship.status === 200, `Status ${ship.status}`)
  }

  // ─── 5. Gastos ──────────────────────────────────────────────────────────────
  console.log('\n📋 FASE 5: Reportes de Gastos\n')

  const newExpense = await apiCall('POST', '/api/expenses', pharmacyCookie, {
    amount: 1500,
    description: 'Compra de insumos de oficina - Test E2E',
    category: 'SUPPLIES',
    receiptDate: new Date().toISOString(),
  })
  assert('Farmacia: Crear gasto', newExpense.status === 201 || newExpense.status === 200, `Status ${newExpense.status}, ${JSON.stringify(newExpense.data).substring(0, 100)}`)

  const expenseId = newExpense.data?._id || newExpense.data?.data?._id

  const allExpenses = await apiCall('GET', '/api/expenses', supervisorCookie)
  assert('Supervisor: Ver todos los gastos', allExpenses.status === 200, `Status ${allExpenses.status}`)

  if (expenseId) {
    const approve = await apiCall('PATCH', `/api/expenses/${expenseId}`, supervisorCookie, {
      status: 'APPROVED',
      adminComment: 'Gasto válido y documentado',
    })
    assert('Supervisor: Aprobar gasto', approve.status === 200, `Status ${approve.status}`)
  }

  // Crear otro gasto para testear rechazo
  const newExpense2 = await apiCall('POST', '/api/expenses', pharmacyCookie, {
    amount: 800,
    description: 'Gasto a rechazar - Test E2E',
    category: 'OTHER',
    receiptDate: new Date().toISOString(),
  })
  const expense2Id = newExpense2.data?._id || newExpense2.data?.data?._id

  if (expense2Id) {
    const reject = await apiCall('PATCH', `/api/expenses/${expense2Id}`, supervisorCookie, {
      status: 'REJECTED',
      adminComment: 'Comprobante ilegible, favor reenviar',
    })
    assert('Supervisor: Rechazar gasto', reject.status === 200, `Status ${reject.status}`)
  }

  // Farmacia no puede aprobar gastos
  if (expenseId) {
    const farmaciaApprove = await apiCall('PATCH', `/api/expenses/${expenseId}`, pharmacyCookie, {
      status: 'APPROVED',
    })
    assert('Farmacia NO puede aprobar gastos', farmaciaApprove.status === 403, `Status ${farmaciaApprove.status} (esperado 403)`)
  }

  // ─── 6. Perfil de Usuario ───────────────────────────────────────────────────
  console.log('\n📋 FASE 6: Gestión de Perfil\n')

  const updateProfile = await apiCall('POST', '/api/user/profile', pharmacyCookie, {
    name: 'Farmacia Centro Norte (Test)',
    phone: '+503 7777-8888',
  })
  assert('Farmacia: Actualizar perfil', updateProfile.status === 200, `Status ${updateProfile.status}`)

  const wrongPassword = await apiCall('POST', '/api/user/password', pharmacyCookie, {
    currentPassword: 'WrongPassword999!',
    newPassword: 'NewPass123!',
  })
  assert('Cambio contraseña con pass incorrecto falla', wrongPassword.status === 400, `Status ${wrongPassword.status} (esperado 400)`)

  const correctPassword = await apiCall('POST', '/api/user/password', pharmacyCookie, {
    currentPassword: 'Farmacia123!',
    newPassword: 'FarmaciaNew123!',
  })
  assert('Cambio contraseña correcto funciona', correctPassword.status === 200, `Status ${correctPassword.status}`)

  // Revert password so we can test next time
  const revertPassword = await apiCall('POST', '/api/user/password', pharmacyCookie, {
    currentPassword: 'FarmaciaNew123!',
    newPassword: 'Farmacia123!',
  })
  assert('Revertir contraseña', revertPassword.status === 200, `Status ${revertPassword.status}`)

  // ─── Resumen ────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length
  const failed = results.filter(r => !r.pass).length

  console.log('\n' + '═'.repeat(60))
  console.log(` RESULTADOS: ${passed} PASSED ✅  |  ${failed} FAILED ❌`)
  console.log('═'.repeat(60))
  
  if (failed > 0) {
    console.log('\n📋 FALLIDOS:')
    results.filter(r => !r.pass).forEach(r => {
      console.log(`   ❌ ${r.test}: ${r.detail}`)
    })
  }
  console.log('')
}

runTests().catch(console.error)
