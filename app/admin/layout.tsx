// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Bell,
  BarChart3,
  Store,
  ClipboardList,
  Leaf,
  Users,
} from 'lucide-react';

type UserType = {
  id: string;
  email: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ============================================================
  // VERIFICAR ADMIN
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
          if (!cancelled) router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
          if (!cancelled) router.push('/dashboard');
          return;
        }

        if (!cancelled) {
          setUser({ id: authUser.id, email: authUser.email || '' });
        }
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        if (!cancelled) router.push('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ============================================================
  // LOGOUT
  // ============================================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ✅ Função auxiliar para fechar o menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { id: 'orders', icon: ClipboardList, label: 'Pedidos', href: '/admin/orders' },
    { id: 'products', icon: ShoppingBag, label: 'Produtos', href: '/admin/products' },
    { id: 'categories', icon: Store, label: 'Categorias', href: '/admin/categories' },
    { id: 'delivery', icon: Truck, label: 'Entregadores', href: '/admin/delivery' },
    { id: 'users', icon: Users, label: 'Clientes', href: '/admin/users' },
    { id: 'reports', icon: BarChart3, label: 'Relatórios', href: '/admin/reports' },
    { id: 'settings', icon: Settings, label: 'Configurações', href: '/admin/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex flex-col">
      {/* Header */}
      <header className="bg-[#1b4332] shadow-lg sticky top-0 z-50">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
                aria-label="Abrir menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>

              <Link href="/admin" className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="text-base sm:text-lg font-bold text-white block leading-tight">
                    30 Express
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#a7c957] font-medium leading-tight">
                    Painel Admin
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
              >
                <Home className="w-4 h-4" />
                <span className="hidden lg:inline">Voltar à Loja</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Sair"
              >
                <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Conteúdo */}
      <div className="flex flex-1 relative">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white shadow-lg sticky top-[64px] h-[calc(100vh-64px)] flex-shrink-0">
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? 'bg-[#2d6a4f] text-white shadow-md'
                      : 'text-gray-600 hover:bg-[#f5f0eb]'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2 bg-[#f5f0eb] rounded-xl">
              <div className="w-10 h-10 bg-[#2d6a4f] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">Administrador</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Menu (Gaveta) */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={closeMobileMenu}
            ></div>

            <aside className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-white shadow-2xl z-50 lg:hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="bg-[#2d6a4f] p-1.5 rounded-lg">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-[#2d6a4f]">30 Express</span>
                </Link>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-5 bg-[#f8f6f4] border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#2d6a4f] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closeMobileMenu}   // ✅ Fecha ao clicar
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                        isActive
                          ? 'bg-[#2d6a4f] text-white shadow-md'
                          : 'text-gray-600 hover:bg-[#f5f0eb]'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-100 space-y-2 flex-shrink-0">
                <Link
                  href="/"
                  onClick={closeMobileMenu}   // ✅ Fecha ao clicar
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2d6a4f] bg-[#f0f7f3] hover:bg-[#e8f3ec] transition font-medium"
                >
                  <Home className="w-5 h-5" />
                  <span>Voltar à Loja</span>
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();   // ✅ Fecha antes de sair
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Conteúdo */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}