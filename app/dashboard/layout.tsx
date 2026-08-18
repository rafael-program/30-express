// app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-[#f5f0eb]">
        {children}
      </div>
    )
  } catch (error) {
    console.error('Erro no DashboardLayout:', error)
    redirect('/login')
  }
}