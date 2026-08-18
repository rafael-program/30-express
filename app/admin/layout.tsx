// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
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
  UserCog,
  FileText,
  DollarSign,
  TrendingUp,
  Leaf
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('🔍 Verificando admin...');
        
        // 1. Verificar se está logado
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('❌ Usuário não logado');
          router.push('/login');
          return;
        }

        console.log('👤 Usuário:', user.id, user.email);

        // 2. Buscar o perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        console.log('📋 Perfil:', profile);

        // 3. Verificar se é admin ou manager
        if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
          console.log('❌ Usuário não é admin. Role:', profile?.role);
          router.push('/dashboard');
          return;
        }

        console.log('✅ Admin verificado!');
        setUser(user);

      } catch (error) {
        console.error('💥 Erro ao verificar admin:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Header */}
      <header className="bg-[#1b4332] shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>

              <Link href="/admin" className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-white">30 Express</span>
                  <span className="block text-[10px] text-[#a7c957] font-medium">Painel Admin</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
              >
                <Home className="w-4 h-4" />
                Loja
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className={`hidden lg:block w-64 bg-white shadow-lg min-h-[calc(100vh-64px)] sticky top-16 flex-shrink-0`}>
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  window.location.pathname === item.href
                    ? 'bg-[#2d6a4f] text-white shadow-md'
                    : 'text-gray-600 hover:bg-[#f5f0eb]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#f5f0eb] rounded-xl">
              <div className="w-10 h-10 bg-[#2d6a4f] rounded-full flex items-center justify-center text-white font-bold">
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden">
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-[#2d6a4f]">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      window.location.pathname === item.href
                        ? 'bg-[#2d6a4f] text-white'
                        : 'text-gray-600 hover:bg-[#f5f0eb]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}