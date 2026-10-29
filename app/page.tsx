// app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart, LogIn, UserPlus, Search, Leaf, Truck, Clock,
  Shield, Star, TrendingUp, Heart, Menu, X, LayoutDashboard,
  LogOut, Grid3x3, List, Package, Phone, Mail, MapPin, Sparkles,
  ArrowRight, BadgeCheck, MessageCircle, User as UserIcon, Minus, Plus,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  category_id: string | null;
  rating?: number;
  is_organic: boolean;
  stock: number;
  in_stock: boolean;
  weight: string | null;
  created_at: string;
  updated_at: string;
};

type CartItem = Product & { quantity: number };

type AuthUser = {
  id: string;
  email: string;
};

type ProductCardProps = {
  product: Product;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: (p: Product) => void;
  formatPrice: (v: number) => string;
};

// Classe reutilizável para foco visível (acessibilidade)
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);

  const categories = [
    { id: 'all', name: 'Todos os Produtos', icon: '🌿' },
    { id: 'carnes', name: 'Carnes Frescas', icon: '🥩' },
    { id: 'verduras', name: 'Verduras & Folhas', icon: '🥬' },
    { id: 'frutas', name: 'Frutas da Época', icon: '🍎' },
    { id: 'chas', name: 'Chás & Ervas', icon: '🍵' },
    { id: 'legumes', name: 'Legumes & Raízes', icon: '🥕' },
    { id: 'laticinios', name: 'Laticínios', icon: '🧀' },
    { id: 'ovos', name: 'Ovos do Campo', icon: '🥚' },
    { id: 'mercearia', name: 'Mercearia Bio', icon: '🧂' },
    { id: 'padaria', name: 'Pães Naturais', icon: '🍞' },
    { id: 'bebidas', name: 'Sucos & Bebidas', icon: '🧃' },
  ];

  // Buscar dados do banco real
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!cancelled && authUser) {
          setUser({ id: authUser.id, email: authUser.email || '' });
        }
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cancelled) {
          const mapped: Product[] = (productsData || []).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image_url: p.image_url,
            category: p.category_id || p.category,
            category_id: p.category_id,
            is_organic: p.is_organic || false,
            stock: p.stock || 0,
            in_stock: p.in_stock !== false && p.stock > 0,
            weight: p.weight,
            created_at: p.created_at,
            updated_at: p.updated_at,
            rating: 5.0,
          }));
          setProducts(mapped);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Filtros
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'price') comparison = a.price - b.price;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [products, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Carrinho e Favoritos
  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
  };
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goToCheckout = () => {
    if (!user) { router.push('/login'); return; }
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/checkout');
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };
  const formatPrice = (value: number) => new Intl.NumberFormat('pt-AO', {
    style: 'currency', currency: 'AOA', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f5] px-6" role="status" aria-live="polite">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[#2d6a4f]/15 border-t-[#2d6a4f] animate-spin motion-reduce:animate-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="w-8 h-8 text-[#52b788] animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
        <p className="text-[#2d6a4f] font-medium text-sm text-center">Carregando alimentos frescos do Mercado 30...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-gray-800 flex flex-col font-sans selection:bg-[#52b788]/20 selection:text-[#1b4332]">
      {/* Atalho de acessibilidade */}
      <a
        href="#produtos"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:text-[#1b4332] focus:shadow-lg"
      >
        Ir para os produtos
      </a>

      {/* Topo */}
      <div className="bg-[#1b4332] text-white text-xs py-2 px-4 hidden sm:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-[#f4a261]" />
              Entregas no mesmo dia para Luanda (Mercado 30)
            </span>
            <span className="flex items-center gap-1.5 text-white/75">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              Atendimento Seg - Sáb: 07h às 21h
            </span>
          </div>
          <div className="flex items-center gap-5 text-white/90">
            <a
              href="https://wa.me/244936953381"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 hover:text-[#f4a261] transition-colors font-medium rounded ${focusRing}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#52b788]" />
              WhatsApp: +244 936 953 381
            </a>
            <span className="text-[#a7c957] font-semibold">100% Fresco Garantido</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] shadow-natural-lg sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="30 Express - página inicial"
              className={`flex items-center flex-shrink-0 rounded-2xl transition-transform duration-200 hover:scale-[1.02] motion-reduce:transition-none ${focusRing}`}
            >
              <div className="bg-white/95 py-1.5 px-3 rounded-2xl shadow-sm ring-1 ring-white/30 flex items-center">
                <Image src="/logo-transparent.png" alt="30 Express" width={120} height={48} className="h-10 sm:h-12 w-auto object-contain" priority />
              </div>
            </Link>

            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Pesquisar produtos"
                  placeholder="Pesquisar carnes, frutas, verduras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 rounded-full bg-white/95 text-gray-800 placeholder-gray-500 ring-1 ring-white/40 focus:outline-none focus:ring-2 focus:ring-[#f4a261] focus:bg-white transition text-sm shadow-inner [&::-webkit-search-cancel-button]:hidden"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpar pesquisa"
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded-full ${focusRing}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className={`hidden sm:flex items-center gap-2 px-4 py-2 bg-[#52b788] text-white rounded-full hover:bg-[#40916c] transition-colors font-medium shadow-md text-sm ${focusRing}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="hidden lg:flex items-center gap-1.5 text-white/90 text-sm bg-white/10 px-3 py-1.5 rounded-full ring-1 ring-white/10">
                    <UserIcon className="w-4 h-4 text-emerald-300" />
                    <span className="truncate max-w-[120px] font-medium">{user.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sair"
                    aria-label="Sair da conta"
                    className={`hidden sm:flex items-center justify-center p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-full transition-colors ring-1 ring-white/20 ${focusRing}`}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={`hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors text-sm font-medium ring-1 ring-white/20 ${focusRing}`}
                  >
                    <LogIn className="w-4 h-4 text-emerald-300" />
                    <span>Entrar</span>
                  </Link>
                  <Link
                    href="/register"
                    className={`hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#f4a261] text-white hover:bg-[#e76f51] rounded-full transition-colors text-sm font-semibold shadow-md ${focusRing}`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Conta</span>
                  </Link>
                </div>
              )}

              <button
                onClick={() => setShowCart(true)}
                aria-label={`Abrir carrinho, ${cartItemsCount} ${cartItemsCount === 1 ? 'item' : 'itens'}`}
                className={`relative flex items-center gap-2 px-3.5 py-2 bg-white text-[#1b4332] rounded-full hover:bg-emerald-50 transition-colors shadow-md font-semibold text-sm group ${focusRing}`}
              >
                <ShoppingCart className="w-4 h-4 text-[#2d6a4f] group-hover:scale-110 transition-transform motion-reduce:transition-none" />
                <span className="hidden md:inline font-bold tabular-nums">{cartItemsCount > 0 ? formatPrice(cartTotal) : 'Carrinho'}</span>
                {cartItemsCount > 0 && (
                  <span className="bg-[#e76f51] text-white text-[11px] font-extrabold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center tabular-nums">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isMobileMenuOpen}
                className={`md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors ${focusRing}`}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 p-3 space-y-2 bg-[#17382a]/95 rounded-2xl ring-1 ring-white/10 shadow-xl">
              <div className="relative w-full mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Pesquisar produtos"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4a261]"
                />
              </div>
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#52b788] rounded-xl text-white font-medium text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" />Meu Dashboard
                  </Link>
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white text-sm">
                    <LogOut className="w-4 h-4" />Encerrar Sessão
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogIn className="w-4 h-4 text-emerald-300" />Entrar
                  </Link>
                  <Link href="/register" className="flex items-center gap-3 px-4 py-3 bg-[#f4a261] rounded-xl text-white font-semibold text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <UserPlus className="w-4 h-4" />Cadastrar-se
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#1b4332] via-[#245741] to-[#2d6a4f] text-white py-14 md:py-24 overflow-hidden">
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#52b788]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-10 w-80 h-80 bg-[#f4a261]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 text-[#d8f3dc] text-xs sm:text-sm font-semibold">
                <Leaf className="w-4 h-4 text-[#74c69d]" />
                <span>Colheita fresca direto do Mercado 30</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-balance">
                Alimentos{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74c69d] via-[#a7c957] to-[#d8f3dc]">Saudáveis</span>
                <br className="hidden sm:inline" />
                <span className="text-white"> & </span>
                <span className="text-[#f4a261]">100% Naturais</span>
              </h1>
              <p className="text-base sm:text-lg text-emerald-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Receba carnes selecionadas, verduras frescas, frutas da época, chás e legumes direto do <strong className="text-white">Mercado 30</strong> na porta da sua casa.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href="#produtos"
                  className={`px-7 py-3.5 bg-[#f4a261] hover:bg-[#e76f51] text-white rounded-full font-bold shadow-lg shadow-black/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 motion-reduce:transition-none flex items-center gap-2 text-sm sm:text-base ${focusRing}`}
                >
                  <Package className="w-5 h-5" />Ver Produtos Frescos
                </a>
                <a
                  href="https://wa.me/244936953381"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold ring-1 ring-white/30 backdrop-blur-md transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base ${focusRing}`}
                >
                  <MessageCircle className="w-5 h-5 text-[#52b788]" />Pedir no WhatsApp
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-3 bg-white/10 rounded-[2rem] blur-xl pointer-events-none" />
                <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl ring-1 ring-white/50 text-gray-800 text-center relative z-10">
                  <div className="inline-flex items-center gap-1.5 bg-[#d8f3dc] text-[#1b4332] text-xs font-bold px-3 py-1 rounded-full mb-4">
                    <BadgeCheck className="w-4 h-4 text-[#2d6a4f]" />Mercado 30 Express • Luanda
                  </div>
                  <Image src="/logo-transparent.png" alt="Logo 30 Express" width={300} height={100} className="w-full max-h-24 object-contain mx-auto mb-4" />
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">A sua feira diária de confiança com os melhores alimentos orgânicos.</p>
                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                    {[
                      { e: '🥩', l: 'Carnes' },
                      { e: '🥬', l: 'Verduras' },
                      { e: '🍎', l: 'Frutas' },
                      { e: '🍵', l: 'Chás' },
                    ].map((c) => (
                      <div key={c.l} className="bg-[#f2f7f4] py-2.5 px-1 rounded-2xl text-center">
                        <span className="text-xl block" aria-hidden="true">{c.e}</span>
                        <span className="text-[10px] font-bold text-[#1b4332]">{c.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="bg-white border-b border-[#e8efe9] py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {[
              { icon: Truck, title: 'Entrega Express', text: 'Em até 1h em Luanda', bg: 'bg-[#d8f3dc]', color: 'text-[#2d6a4f]' },
              { icon: Leaf, title: 'Direto do Produtor', text: 'Frescura inigualável', bg: 'bg-[#ffe8d6]', color: 'text-[#e76f51]' },
              { icon: Shield, title: 'Pagamento na Entrega', text: 'TPA ou Dinheiro', bg: 'bg-[#d8f3dc]', color: 'text-[#2d6a4f]' },
              { icon: Clock, title: 'Horário Flexível', text: 'Seg - Sáb: 7h às 21h', bg: 'bg-[#ffe8d6]', color: 'text-[#e76f51]' },
            ].map(({ icon: Icon, title, text, bg, color }) => (
              <div key={title} className="flex items-center gap-3 p-3 rounded-2xl bg-[#fbf9f5] ring-1 ring-[#eef4f0]">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-[#1b4332] leading-tight">{title}</h4>
                  <p className="text-[11px] text-gray-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="container mx-auto px-4 pt-10 pb-4" aria-labelledby="titulo-categorias">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 id="titulo-categorias" className="text-xl sm:text-2xl font-extrabold text-[#1b4332] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#52b788]" />Categorias de Alimentos
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Selecione o tipo de alimento fresco</p>
          </div>
          {selectedCategory !== 'all' && (
            <button onClick={() => setSelectedCategory('all')} className={`text-xs font-semibold text-[#2d6a4f] hover:underline rounded ${focusRing}`}>
              Ver todas
            </button>
          )}
        </div>
        <div className="relative">
          <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 -mx-4 px-4 scrollbar-thin no-scrollbar snap-x">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={isSelected}
                  className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 motion-reduce:transition-none text-sm font-semibold ${focusRing} ${
                    isSelected
                      ? 'bg-[#2d6a4f] text-white shadow-natural-lg ring-2 ring-[#52b788]/50'
                      : 'bg-white text-gray-700 hover:bg-[#f0f7f3] ring-1 ring-[#e8efe9] shadow-sm hover:ring-[#52b788]/40'
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">{cat.icon}</span>
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Produtos */}
      <section className="container mx-auto px-4 pt-2 pb-6 mb-12 scroll-mt-24" id="produtos">
        <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-[#e8efe9] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d8f3dc] flex items-center justify-center">
              <Package className="w-4 h-4 text-[#2d6a4f]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#1b4332]">
                {selectedCategory === 'all' ? 'Todos os Alimentos Frescos' : categories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-xs text-gray-500" aria-live="polite">{filteredProducts.length} produtos disponíveis</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <select
                aria-label="Ordenar por"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
                className="px-3 py-2 bg-[#fbf9f5] ring-1 ring-[#d8e5db] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#52b788]"
              >
                <option value="name">Nome (A-Z)</option>
                <option value="price">Menor Preço</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                aria-label={sortOrder === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
                className={`w-9 h-9 bg-[#fbf9f5] ring-1 ring-[#d8e5db] rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700 ${focusRing}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <div className="flex bg-[#fbf9f5] ring-1 ring-[#d8e5db] rounded-xl p-0.5" role="group" aria-label="Modo de visualização">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Ver em grelha"
                aria-pressed={viewMode === 'grid'}
                className={`p-2 rounded-lg transition-colors ${focusRing} ${viewMode === 'grid' ? 'bg-[#2d6a4f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Ver em lista"
                aria-pressed={viewMode === 'list'}
                className={`p-2 rounded-lg transition-colors ${focusRing} ${viewMode === 'list' ? 'bg-[#2d6a4f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6' : 'grid grid-cols-1 gap-4'}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              onAddToCart={addToCart}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center ring-1 ring-[#e8efe9] shadow-sm my-6 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#ffe8d6] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" aria-hidden="true">🔍</div>
            <h3 className="text-lg font-bold text-[#1b4332] mb-1">Nenhum produto encontrado</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm
                ? <>Não encontramos resultados para &quot;{searchTerm}&quot;.</>
                : 'Não há produtos nesta categoria de momento.'}
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className={`px-6 py-2.5 bg-[#2d6a4f] text-white rounded-full text-sm font-semibold hover:bg-[#1b4332] transition-colors ${focusRing}`}
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#11241c] text-gray-300 pt-16 pb-8 border-t border-emerald-950 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/95 py-2 px-3 rounded-2xl inline-block shadow-sm">
                <Image src="/logo-transparent.png" alt="Logo 30 Express" width={100} height={40} className="h-10 w-auto object-contain" />
              </div>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                Plataforma oficial de delivery do <strong className="text-gray-200">Mercado 30</strong> em Luanda.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-emerald-400">Departamentos</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                {[
                  { id: 'carnes', label: '🥩 Carnes Frescas' },
                  { id: 'verduras', label: '🥬 Verduras & Folhas' },
                  { id: 'frutas', label: '🍎 Frutas da Época' },
                ].map((d) => (
                  <li key={d.id}>
                    <button onClick={() => setSelectedCategory(d.id)} className={`hover:text-white transition-colors rounded ${focusRing}`}>
                      {d.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-emerald-400">Atendimento</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#f4a261]" /><span>+244 936 953 381</span></li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#f4a261]" /><span className="break-all">30express2025@gmail.com</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-emerald-400">Localização</h4>
              <p className="text-sm text-gray-400 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#52b788] mt-0.5 flex-shrink-0" /><span>Mercado 30, Luanda, Angola</span>
              </p>
            </div>
          </div>
          <div className="border-t border-emerald-950/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 30 Express. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal Carrinho */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCart(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Meu carrinho"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
          >
            <div className="p-5 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-[#74c69d]" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Meu Carrinho</h3>
                  <p className="text-xs text-emerald-200">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCart(false)}
                aria-label="Fechar carrinho"
                className={`p-2 hover:bg-white/20 rounded-full transition-colors ${focusRing}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3" aria-hidden="true">🧺</div>
                  <h4 className="font-bold text-gray-800">Seu carrinho está vazio</h4>
                  <p className="text-xs text-gray-500 mt-1">Adicione produtos frescos para começar.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-[#fbf9f5] ring-1 ring-[#e8efe9] rounded-2xl p-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f0f7f3] flex-shrink-0 flex items-center justify-center">
                      {item.image_url ? (
                        <Image src={item.image_url} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <span className="text-xl" aria-hidden="true">🌿</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-[#2d6a4f] tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white ring-1 ring-[#d8e5db] rounded-full p-1 shadow-sm">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remover uma unidade de ${item.name}`}
                        className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#2d6a4f] ${focusRing}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-gray-700 tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        aria-label={`Adicionar uma unidade de ${item.name}`}
                        className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#2d6a4f] ${focusRing}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-[#e8efe9] bg-[#fbf9f5] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Subtotal</span>
                  <span className="text-xl font-extrabold text-[#1b4332] tabular-nums">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={goToCheckout}
                  className={`w-full py-3.5 bg-[#f4a261] hover:bg-[#e76f51] text-white rounded-2xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 text-sm ${focusRing}`}
                >
                  {user ? 'Finalizar Pedido' : 'Entrar para Finalizar'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE CARD DE PRODUTO (TIPADO E COM MODO LISTA)
// ============================================================
function ProductCard({ product, viewMode, isFavorite, onToggleFavorite, onAddToCart, formatPrice }: ProductCardProps) {
  const inStock = product.in_stock && product.stock > 0;

  if (viewMode === 'list') {
    return (
      <article className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 ring-1 ring-[#e8efe9] overflow-hidden flex flex-col sm:flex-row items-stretch p-4 gap-4 group">
        <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-[#f0f7f3] relative flex-shrink-0 flex items-center justify-center">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} width={160} height={160} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none" unoptimized />
          ) : (
            <span className="text-5xl text-gray-300" aria-hidden="true">🌿</span>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
              <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-bold">Esgotado</span>
            </div>
          )}
        </div>
        <div className="flex-1 w-full flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#52b788]">{product.category || 'Geral'}</span>
              {product.is_organic && (
                <span className="bg-[#d8f3dc] text-[#1b4332] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-[#2d6a4f]" />Orgânico
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{product.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-lg font-extrabold text-[#1b4332] tabular-nums">{formatPrice(product.price)}</span>
            <button
              onClick={() => onAddToCart(product)}
              disabled={!inStock}
              className={`px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />{inStock ? 'Adicionar' : 'Esgotado'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-3xl shadow-sm hover:shadow-natural-lg transition-all duration-300 motion-reduce:transition-none ring-1 ring-[#e8efe9] overflow-hidden flex flex-col group hover:-translate-y-1 motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] bg-[#f4f7f5] overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300" aria-hidden="true">🌿</div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.is_organic && (
            <span className="bg-[#1b4332]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#74c69d]" />Orgânico
            </span>
          )}
        </div>
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
          aria-pressed={isFavorite}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm z-10 transition-colors ${focusRing}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="bg-white text-gray-800 px-4 py-1.5 rounded-full text-xs font-bold">Esgotado</span>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#52b788]">{product.category || 'Geral'}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#f4a261] text-[#f4a261]" />
              <span className="text-xs font-bold text-gray-700">{product.rating || 5.0}</span>
            </div>
          </div>
          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">{product.description || 'Alimento fresco do Mercado 30.'}</p>
        </div>
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Preço</p>
            <p className="text-base sm:text-lg font-extrabold text-[#1b4332] tabular-nums">{formatPrice(product.price)}</p>
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={!inStock}
            className={`px-4 py-2.5 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />{inStock ? 'Comprar' : 'Indisponível'}
          </button>
        </div>
      </div>
    </article>
  );
}