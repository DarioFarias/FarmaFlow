import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock MongoDB connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

// Mock User model
vi.mock('@/models/User', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

// Mock roles
vi.mock('@/lib/roles', () => ({
  getCreatableRoles: vi.fn(),
  isSupervisor: vi.fn(),
}))

describe('getFilteredUsers', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Setup default mock behavior for roles
    const { getCreatableRoles, isSupervisor } = await import('@/lib/roles')
    ;(getCreatableRoles as any).mockImplementation((role?: string) => {
      if (role === 'SUPERVISOR') return ['ENCARGADO', 'VENDEDOR']
      if (role === 'ADMIN') return ['SUPERVISOR', 'ENCARGADO', 'VENDEDOR']
      if (role === 'SUPER_ADMIN') return ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ENCARGADO', 'VENDEDOR']
      return []
    })
    ;(isSupervisor as any).mockImplementation((role?: string) => role === 'SUPERVISOR')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('search $regex via $or', () => {
    it('should build $or query for name, username, and email with case-insensitive regex', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      // Mock chain: find -> sort -> skip -> limit -> select -> lean
      const mockUsers = [
        { _id: '1', name: 'John Doe', username: 'johnd', email: 'john@example.com' }
      ]
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(1)

      // Act
      const result = await getFilteredUsers({ search: 'john' })

      // Assert
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).toHaveProperty('$or')
      expect(queryArg.$or).toHaveLength(3)
      
      // Check name regex
      expect(queryArg.$or[0]).toHaveProperty('name.$regex', 'john')
      expect(queryArg.$or[0]).toHaveProperty('name.$options', 'i')
      
      // Check username regex
      expect(queryArg.$or[1]).toHaveProperty('username.$regex', 'john')
      expect(queryArg.$or[1]).toHaveProperty('username.$options', 'i')
      
      // Check email regex
      expect(queryArg.$or[2]).toHaveProperty('email.$regex', 'john')
      expect(queryArg.$or[2]).toHaveProperty('email.$options', 'i')
    })

    it('should NOT add $or when search is empty', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({ search: '' })

      // Assert
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).not.toHaveProperty('$or')
    })
  })

  describe('role-based filtering (ADMIN/SUPERVISOR)', () => {
    it('should filter by role for ADMIN using $in with allowed roles', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const { getCreatableRoles } = await import('@/lib/roles')
      
      const User = (await import('@/models/User')).default
      
      // ADMIN can create: SUPERVISOR, ENCARGADO, VENDEDOR
      ;(getCreatableRoles as any).mockReturnValue(['SUPERVISOR', 'ENCARGADO', 'VENDEDOR'])
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({ userRole: 'ADMIN' })

      // Assert
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).toHaveProperty('role')
      expect(queryArg.role).toHaveProperty('$in')
      expect(queryArg.role.$in).toEqual(['SUPERVISOR', 'ENCARGADO', 'VENDEDOR'])
    })

    it('should filter by role for SUPERVISOR using $in with allowed roles', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const { getCreatableRoles } = await import('@/lib/roles')
      
      const User = (await import('@/models/User')).default
      
      // SUPERVISOR can create: ENCARGADO, VENDEDOR
      ;(getCreatableRoles as any).mockReturnValue(['ENCARGADO', 'VENDEDOR'])
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({ userRole: 'SUPERVISOR' })

      // Assert
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).toHaveProperty('role')
      expect(queryArg.role).toHaveProperty('$in')
      expect(queryArg.role.$in).toEqual(['ENCARGADO', 'VENDEDOR'])
    })

    it('should not filter by role when userRole is not provided', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({})

      // Assert
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).not.toHaveProperty('role')
    })
  })

  describe('empty assignedPharmacies', () => {
    it('should return empty result when SUPERVISOR has empty assignedPharmacies', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const { isSupervisor } = await import('@/lib/roles')
      const User = (await import('@/models/User')).default
      
      // Mock isSupervisor to return true for SUPERVISOR
      ;(isSupervisor as any).mockImplementation((role: string) => role === 'SUPERVISOR')
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await getFilteredUsers({ 
        userRole: 'SUPERVISOR', 
        assignedPharmacies: [] 
      })

      // Assert - should return empty without calling DB
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('should filter by assignedPharmacies for SUPERVISOR with non-empty array', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const { getCreatableRoles } = await import('@/lib/roles')
      const User = (await import('@/models/User')).default
      
      ;(getCreatableRoles as any).mockReturnValue(['ENCARGADO', 'VENDEDOR'])
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({ 
        userRole: 'SUPERVISOR', 
        assignedPharmacies: ['pharm-1', 'pharm-2']
      })

      // Assert
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).toHaveProperty('assignedPharmacies')
      expect(queryArg.assignedPharmacies).toHaveProperty('$in')
      expect(queryArg.assignedPharmacies.$in).toEqual(['pharm-1', 'pharm-2'])
    })

    it('should NOT filter by assignedPharmacies for ADMIN', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const { getCreatableRoles } = await import('@/lib/roles')
      const User = (await import('@/models/User')).default
      
      ;(getCreatableRoles as any).mockReturnValue(['SUPERVISOR', 'ENCARGADO', 'VENDEDOR'])
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({ 
        userRole: 'ADMIN', 
        assignedPharmacies: ['pharm-1', 'pharm-2']
      })

      // Assert - ADMIN should NOT have assignedPharmacies filter
      expect(User.find).toHaveBeenCalled()
      const queryArg = (User.find as any).mock.calls[0][0]
      expect(queryArg).not.toHaveProperty('assignedPharmacies')
    })
  })

  describe('pagination skip/limit', () => {
    it('should use skip and limit for pagination', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      const mockUsers = [
        { _id: '1', name: 'User 1' },
        { _id: '2', name: 'User 2' },
      ]
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(22)

      // Act - page 2 with pageSize 20 should skip first 20
      const result = await getFilteredUsers({ page: 2, pageSize: 20 })

      // Assert
      expect(User.find).toHaveBeenCalled()
      
      // Check skip was called with (page-1) * pageSize = (2-1) * 20 = 20
      const sortMock = (User.find as any).mock.results[0].value.sort
      const skipMock = sortMock.mock.results[0].value.skip
      expect(skipMock).toHaveBeenCalledWith(20)
      
      // Check limit was called with pageSize
      const limitMock = skipMock.mock.results[0].value.limit
      expect(limitMock).toHaveBeenCalledWith(20)
    })

    it('should calculate totalPages correctly', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      // 45 users / 20 per page = 3 pages
      ;(User.countDocuments as any).mockResolvedValue(45)

      // Act
      const result = await getFilteredUsers({ page: 1, pageSize: 20 })

      // Assert
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(3)
      expect(result.total).toBe(45)
    })

    it('should use default page=1 and pageSize=20 when not provided', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({})

      // Assert - default page should be 1, skip should be 0
      const sortMock = (User.find as any).mock.results[0].value.sort
      const skipMock = sortMock.mock.results[0].value.skip
      expect(skipMock).toHaveBeenCalledWith(0) // (1-1) * 20 = 0
    })

    it('should return empty pagination when no users', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await getFilteredUsers({})

      // Assert
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('buildUserFilter helper', () => {
    it('should be exported and produce correct filter object', async () => {
      // Import the helper directly
      const { buildUserFilter } = await import('../users')
      
      // Test with all parameters
      const filter = buildUserFilter({
        search: 'test',
        userRole: 'ADMIN',
        assignedPharmacies: ['pharm-1'],
      })

      expect(filter).toHaveProperty('$or')
      expect(filter).toHaveProperty('role')
      expect(filter.role).toHaveProperty('$in')
    })
  })

  describe('return value shape', () => {
    it('should return GetUsersResult shape', async () => {
      // Arrange
      const { getFilteredUsers } = await import('../users')
      const User = (await import('@/models/User')).default
      
      const mockUsers = [
        { _id: '1', name: 'User 1', username: 'user1', email: 'user1@test.com', role: 'VENDEDOR', isActive: true, phone: '123', assignedPharmacies: ['pharm-1'], profileImage: null, createdAt: new Date() }
      ]
      
      ;(User.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        }),
      })
      ;(User.countDocuments as any).mockResolvedValue(1)

      // Act
      const result = await getFilteredUsers({ page: 1, pageSize: 20 })

      // Assert - verify shape
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('totalPages')
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(1)
    })
  })
})