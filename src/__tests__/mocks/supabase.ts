import { vi } from 'vitest'

export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
}

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
  },
}

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseClient),
}))

export { mockSupabaseClient }
