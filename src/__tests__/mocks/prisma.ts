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
  groupBy: vi.fn(),
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
  feedback: createMockModel(),
  userExternalLink: { ...createMockModel(), createMany: vi.fn() },
  chartMemo: createMockModel(),
  portfolioSnapshot: createMockModel(),
  stockPriceSnapshot: { ...createMockModel(), createMany: vi.fn() },
  userGamification: createMockModel(),
  xpActivityLog: createMockModel(),
  userChecklist: createMockModel(),
  checklistCheck: createMockModel(),
  investmentDiary: createMockModel(),
  diaryNewsItem: { ...createMockModel(), createMany: vi.fn() },
  $transaction: vi.fn((arg: unknown) => {
    if (typeof arg === 'function') return arg(prismaMock)
    if (Array.isArray(arg)) return Promise.all(arg)
    return Promise.resolve(arg)
  }),
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))
