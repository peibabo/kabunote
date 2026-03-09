import { vi } from 'vitest'

const createMockModel = () => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
})

export const prismaMock = {
  user: createMockModel(),
  stock: createMockModel(),
  stockMemo: createMockModel(),
  stockPrice: createMockModel(),
  stockPosition: createMockModel(),
  stockEvent: createMockModel(),
  stockDividend: createMockModel(),
  stockBenefit: createMockModel(),
  stockTag: createMockModel(),
  nextActionPlan: createMockModel(),
  stockTabState: createMockModel(),
  favoriteGroup: createMockModel(),
  stockFavoriteGroup: createMockModel(),
  snoozedAlert: createMockModel(),
  $transaction: vi.fn((arg: unknown) => {
    if (typeof arg === 'function') return arg(prismaMock)
    if (Array.isArray(arg)) return Promise.all(arg)
    return Promise.resolve(arg)
  }),
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))
