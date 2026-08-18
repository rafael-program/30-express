// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const protectedRoutes = ['/dashboard', '/admin', '/delivery', '/profile', '/orders', '/checkout']
  const authRoutes = ['/login', '/register']

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))

  // 🔥 Se não estiver logado e tentar acessar rota protegida
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // 🔥 Se estiver logado e tentar acessar login/register, redirecionar baseado na role
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (profile?.role === 'delivery') {
      return NextResponse.redirect(new URL('/delivery', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 🔥 Rota admin - verificar role e redirecionar se não for admin
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      // Se for delivery, vai para /delivery, senão vai para /dashboard
      if (profile?.role === 'delivery') {
        return NextResponse.redirect(new URL('/delivery', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 🔥 Rota delivery - verificar role e redirecionar se não for delivery
  if (path.startsWith('/delivery')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'delivery') {
      // Se for admin, vai para /admin, senão vai para /dashboard
      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 🔥 Rota dashboard - verificar se o usuário é admin ou delivery
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (profile?.role === 'delivery') {
      return NextResponse.redirect(new URL('/delivery', request.url))
    }
  }

  // 🔥 Rota inicial (/) - redirecionar baseado na role
  if (path === '/') {
    if (!user) {
      return response // Mostra a home page para não logados
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'admin') {
      // Admin vai para o admin, mas pode acessar a home também
      // Não redirecionamos forçadamente para que o admin possa ver a home
      return response
    } else if (profile?.role === 'delivery') {
      // Delivery vai para /delivery
      return NextResponse.redirect(new URL('/delivery', request.url))
    } else {
      // Cliente fica na home
      return response
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api|assets|images).*)',
  ],
}