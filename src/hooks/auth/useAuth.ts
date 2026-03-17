'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface User extends SupabaseUser {
  dbUser?: {
    id: string
    email: string
    name: string | null
    picture: string | null
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Supabaseユーザー情報を使ってデータベースのユーザーレコードを作成/取得
          const userWithDB = await ensureUserInDatabase(session.user)
          setUser(userWithDB)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('ユーザー情報の取得エラー:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userWithDB = await ensureUserInDatabase(session.user)
          setUser(userWithDB)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const ensureUserInDatabase = async (supabaseUser: SupabaseUser): Promise<User> => {
    try {
      // データベースAPIエンドポイント経由でユーザー情報を同期
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || null,
          picture: supabaseUser.user_metadata?.avatar_url || null,
          authProvider: 'google', // 現在はGoogleのみサポート
        }),
      })

      if (!response.ok) {
        throw new Error('ユーザー同期エラー')
      }

      const dbUser = await response.json()
      return {
        ...supabaseUser,
        dbUser,
      }
    } catch (error) {
      console.error('データベースユーザー同期エラー:', error)
      return supabaseUser
    }
  }

  return {
    user,
    loading,
    signOut: () => supabase.auth.signOut(),
  }
}