'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
  Search,
  Leaf,
  Truck,
  Clock,
  Shield,
  Star,
  TrendingUp,
  Heart,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Grid3x3,
  List,
  Package,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  MessageCircle,
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  store_id?: string;
  rating?: number;
  reviews?: number;
  is_organic?: boolean;
  stock?: number;
  in_stock?: boolean;
  weight?: string;
  created_at: string;
  updated_at: string;
};

type CartItem = Product & { quantity: number };

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error || !productsData || productsData.length === 0) {
          setProducts(mockProducts);
        } else {
          const mappedProducts = productsData.map((p: any) => ({
            ...p,
            in_stock: p.stock > 0,
            is_organic: p.is_organic || false,
          }));
          
          const uniqueProducts = mappedProducts.filter((p: Product, index: number, self: Product[]) =>
            index === self.findIndex((t: Product) => t.name === p.name && t.category === p.category)
          );
          
          setProducts(uniqueProducts.length > 0 ? uniqueProducts : mockProducts);
        }
      } catch (error) {
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'rating') comparison = (a.rating || 0) - (b.rating || 0);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory, sortBy, sortOrder]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goToCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f5]">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="w-8 h-8 text-[#52b788] animate-pulse" />
          </div>
        </div>
        <img 
          src="/logo-transparent.png" 
          alt="30 Express" 
          className="h-12 object-contain mb-3 opacity-90"
        />
        <p className="text-[#2d6a4f] font-medium text-sm tracking-wide">
          Carregando alimentos frescos do Mercado 30...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-gray-800 flex flex-col font-sans selection:bg-[#52b788]/20 selection:text-[#1b4332]">
      {/* Topo Informativo */}
      <div className="bg-[#1b4332] text-white text-xs py-1.5 px-4 border-b border-white/10 hidden sm:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-[#f4a261]" />
              Entregas no mesmo dia para Luanda (Mercado 30)
            </span>
            <span className="text-white/40">|</span>
            <span className="flex items-center gap-1 text-white/80">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              Atendimento Seg - Sáb: 07h às 21h
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <a 
              href="https://wa.me/244936953381" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 hover:text-[#f4a261] transition font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#52b788]" />
              WhatsApp: +244 936 953 381
            </a>
            <span className="text-white/40">|</span>
            <span className="text-[#a7c957] font-semibold">100% Fresco Garantido</span>
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] shadow-natural-lg sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Oficial */}
            <Link href="/" className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.02] flex-shrink-0">
              <div className="bg-white/95 p-1.5 px-3 rounded-2xl shadow-sm border border-white/20 backdrop-blur-md flex items-center">
                <img 
                  src="/logo-transparent.png" 
                  alt="30 Express - Alimentos Saudáveis & Naturais" 
                  className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" 
                />
              </div>
            </Link>

            {/* Barra de Pesquisa Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
                <input
                  type="text"
                  placeholder="Pesquisar carnes, frutas, verduras, chás naturais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 rounded-full bg-white/95 text-gray-800 placeholder-gray-500 border border-white/40 focus:outline-none focus:ring-2 focus:ring-[#f4a261] focus:bg-white transition text-sm shadow-inner"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link 
                    href="/dashboard" 
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#52b788] text-white rounded-full hover:bg-[#40916c] transition font-medium shadow-md text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="hidden lg:flex items-center gap-1.5 text-white/90 text-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    <User className="w-4 h-4 text-emerald-300" />
                    <span className="truncate max-w-[120px] font-medium">{user.email?.split('@')[0]}</span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    title="Sair"
                    className="hidden sm:flex items-center justify-center p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-full transition border border-white/20"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  <Link 
                    href="/dashboard" 
                    className="sm:hidden p-2 bg-[#52b788] rounded-full text-white"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link 
                    href="/login" 
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition text-sm font-medium border border-white/20"
                  >
                    <LogIn className="w-4 h-4 text-emerald-300" />
                    <span>Entrar</span>
                  </Link>
                  <Link 
                    href="/register" 
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#f4a261] text-white hover:bg-[#e76f51] rounded-full transition text-sm font-semibold shadow-md hover:shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Conta</span>
                  </Link>
                  <Link 
                    href="/login" 
                    className="sm:hidden p-2 bg-white/10 rounded-full text-white"
                  >
                    <LogIn className="w-5 h-5" />
                  </Link>
                </div>
              )}

              {/* Botão Carrinho */}
              <button 
                onClick={() => setShowCart(true)} 
                className="relative flex items-center gap-2 px-3.5 py-2 bg-white text-[#1b4332] rounded-full hover:bg-emerald-50 transition shadow-md font-semibold text-sm group"
                aria-label="Ver Carrinho"
              >
                <ShoppingCart className="w-4 h-4 text-[#2d6a4f] group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline font-bold">
                  {cartItemsCount > 0 ? formatPrice(cartTotal) : 'Carrinho'}
                </span>
                {cartItemsCount > 0 && (
                  <span className="bg-[#e76f51] text-white text-[11px] font-extrabold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center animate-bounce">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* Menu Mobile */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition"
                aria-label="Abrir Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Search Mobile */}
          <div className="md:hidden mt-2.5 pb-1">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
              <input
                type="text"
                placeholder="Pesquisar alimentos naturais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-full bg-white/95 text-gray-800 placeholder-gray-500 border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#f4a261] transition text-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Menu Mobile Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-white/15 space-y-2 bg-[#17382a]/95 p-3 rounded-2xl">
              {user ? (
                <>
                  <div className="px-3 py-1.5 text-white/80 text-xs">
                    Conectado como: <strong className="text-white">{user.email}</strong>
                  </div>
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-4 py-2.5 bg-[#52b788] rounded-xl text-white font-medium text-sm" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Meu Dashboard
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 bg-white/10 rounded-xl text-white text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Encerrar Sessão
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="flex items-center gap-3 px-4 py-2.5 bg-white/10 rounded-xl text-white text-sm font-medium" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4 text-emerald-300" />
                    Entrar na Minha Conta
                  </Link>
                  <Link 
                    href="/register" 
                    className="flex items-center gap-3 px-4 py-2.5 bg-[#f4a261] rounded-xl text-white font-semibold text-sm" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar-se Grátis
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero Banner Orgânico */}
      <section className="relative bg-gradient-to-b from-[#1b4332] via-[#245741] to-[#2d6a4f] text-white py-12 md:py-20 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#52b788]/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#f4a261]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#d8f3dc] text-xs sm:text-sm font-semibold shadow-sm">
                <Leaf className="w-4 h-4 text-[#74c69d]" />
                <span>Colheita Fresca Direto do Mercado 30</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f4a261]"></span>
                <span className="text-[#ffe8d6]">Luanda</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Alimentos{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74c69d] via-[#a7c957] to-[#d8f3dc]">
                  Saudáveis
                </span>{' '}
                <br className="hidden sm:inline" />
                <span className="text-white">& </span>
                <span className="text-[#f4a261]">100% Naturais</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Receba carnes selecionadas, verduras frescas, frutas da época, chás e legumes direto do <strong>Mercado 30</strong> na porta da sua casa com rapidez e segurança.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a 
                  href="#produtos" 
                  className="px-7 py-3.5 bg-[#f4a261] hover:bg-[#e76f51] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Package className="w-5 h-5" />
                  Ver Produtos Frescos
                </a>
                <a 
                  href="https://wa.me/244936953381?text=Ol%C3%A1,%20gostaria%20de%20fazer%20um%20pedido%20no%2030%20Express" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold border border-white/30 backdrop-blur-md transition-all duration-200 flex items-center gap-2 text-sm sm:text-base hover:border-white"
                >
                  <MessageCircle className="w-5 h-5 text-[#52b788]" />
                  Pedir no WhatsApp
                </a>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/15 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-black text-[#f4a261]">+500</p>
                  <p className="text-xs text-emerald-200">Itens Naturais</p>
                </div>
                <div className="text-center lg:text-left border-x border-white/10 px-2">
                  <p className="text-2xl font-black text-[#74c69d]">1 Hora</p>
                  <p className="text-xs text-emerald-200">Entrega Express</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-black text-[#f4a261]">100%</p>
                  <p className="text-xs text-emerald-200">Garantia Fresca</p>
                </div>
              </div>
            </div>

            {/* Card com o Logo Oficial */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                
                <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 text-gray-800 text-center relative z-10 transform hover:scale-[1.01] transition-transform duration-300">
                  
                  <div className="inline-flex items-center gap-1 bg-[#d8f3dc] text-[#1b4332] text-xs font-bold px-3 py-1 rounded-full mb-4">
                    <BadgeCheck className="w-4 h-4 text-[#2d6a4f]" />
                    MERCADO 30 EXPRESS • LUANDA
                  </div>

                  <div className="py-2 px-4 mb-4">
                    <img 
                      src="/logo-transparent.png" 
                      alt="30 Express - Alimentos Saudáveis e Naturais" 
                      className="w-full max-h-24 sm:max-h-28 object-contain mx-auto filter drop-shadow" 
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-4">
                    A sua feira diária de confiança com os melhores alimentos orgânicos, carnes e legumes.
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                    <div className="bg-[#f2f7f4] p-2 rounded-xl text-center">
                      <span className="text-xl block">🥩</span>
                      <span className="text-[10px] font-bold text-[#1b4332]">Carnes</span>
                    </div>
                    <div className="bg-[#f2f7f4] p-2 rounded-xl text-center">
                      <span className="text-xl block">🥬</span>
                      <span className="text-[10px] font-bold text-[#1b4332]">Verduras</span>
                    </div>
                    <div className="bg-[#f2f7f4] p-2 rounded-xl text-center">
                      <span className="text-xl block">🍎</span>
                      <span className="text-[10px] font-bold text-[#1b4332]">Frutas</span>
                    </div>
                    <div className="bg-[#f2f7f4] p-2 rounded-xl text-center">
                      <span className="text-xl block">🍵</span>
                      <span className="text-[10px] font-bold text-[#1b4332]">Chás</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex absolute -bottom-4 -left-4 bg-[#1b4332] text-white p-3 rounded-2xl shadow-xl items-center gap-2.5 z-20 border border-emerald-500/30">
                  <div className="w-8 h-8 rounded-full bg-[#52b788] flex items-center justify-center text-white">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold">Entrega no Mercado 30</p>
                    <p className="text-emerald-200 text-[10px]">Rapidez & Segurança</p>
                  </div>
                </div>

                <div className="hidden sm:flex absolute -top-4 -right-4 bg-[#f4a261] text-white p-3 rounded-2xl shadow-xl items-center gap-2 z-20">
                  <span className="text-lg">🌿</span>
                  <div className="text-left text-xs">
                    <p className="font-bold">100% Orgânico</p>
                    <p className="text-orange-100 text-[10px]">Sem conservantes</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="bg-white border-b border-[#e8efe9] py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fbf9f5] border border-[#eef4f0]">
              <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1b4332]">Entrega Express</h4>
                <p className="text-[11px] text-gray-500">Em até 1h em Luanda</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fbf9f5] border border-[#eef4f0]">
              <div className="w-10 h-10 rounded-xl bg-[#ffe8d6] text-[#e76f51] flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-[#e76f51]" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1b4332]">Direto do Produtor</h4>
                <p className="text-[11px] text-gray-500">Frescura inigualável</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fbf9f5] border border-[#eef4f0]">
              <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1b4332]">Pagamento na Entrega</h4>
                <p className="text-[11px] text-gray-500">TPA ou Dinheiro</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fbf9f5] border border-[#eef4f0]">
              <div className="w-10 h-10 rounded-xl bg-[#ffe8d6] text-[#e76f51] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#e76f51]" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1b4332]">Horário Flexível</h4>
                <p className="text-[11px] text-gray-500">Seg - Sáb: 7h às 21h</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1b4332] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#52b788]" />
              Categorias de Alimentos
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">Selecione o tipo de alimento fresco que deseja</p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#2d6a4f] hover:underline"
            >
              Ver todas
            </button>
          )}
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-200 text-sm font-semibold ${
                  isSelected
                    ? 'bg-[#2d6a4f] text-white shadow-natural-lg scale-105 ring-2 ring-[#52b788]/50'
                    : 'bg-white text-gray-700 hover:bg-[#f0f7f3] border border-[#e8efe9] shadow-sm hover:border-[#52b788]/40'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f4a261]"></span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Catálogo de Produtos */}
      <section className="container mx-auto px-4 py-6 mb-12" id="produtos">
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#e8efe9] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center font-bold text-sm">
              <Package className="w-4 h-4 text-[#2d6a4f]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#1b4332]">
                {selectedCategory === 'all' 
                  ? 'Todos os Alimentos Frescos' 
                  : categories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-xs text-gray-500">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos disponíveis'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-[#fbf9f5] border border-[#d8e5db] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#52b788]"
              >
                <option value="name">Nome (A-Z)</option>
                <option value="price">Menor Preço</option>
                <option value="rating">Mais Populares</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ordem Crescente' : 'Ordem Decrescente'}
                className="p-2 bg-[#fbf9f5] border border-[#d8e5db] rounded-xl hover:bg-gray-100 transition text-xs font-bold text-gray-700"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <div className="flex bg-[#fbf9f5] border border-[#d8e5db] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-[#2d6a4f] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Modo Grade"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-[#2d6a4f] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Modo Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Grid de Produtos */}
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'grid grid-cols-1 gap-4'
        }>
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

        {/* Estado Vazio de Busca */}
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#e8efe9] shadow-sm my-6 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#ffe8d6] text-[#e76f51] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h3 className="text-lg font-bold text-[#1b4332] mb-1">Nenhum produto encontrado</h3>
            <p className="text-sm text-gray-500 mb-6">
              Não encontramos resultados para &quot;{searchTerm}&quot; nesta categoria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-6 py-2.5 bg-[#2d6a4f] text-white rounded-full text-sm font-semibold hover:bg-[#1b4332] transition shadow-md"
            >
              Limpar Filtros e Ver Tudo
            </button>
          </div>
        )}

      </section>

      {/* Banner CTA WhatsApp */}
      <section className="bg-gradient-to-r from-[#1b4332] via-[#245741] to-[#1b4332] text-white py-12 relative overflow-hidden my-8">
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52b788]/30 text-[#d8f3dc] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#f4a261]" />
                Atendimento Personalizado
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Precisa de uma encomenda especial no Mercado 30?
              </h2>
              <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
                Nossos compradores selecionam as melhores peças de carne, cestas de verduras e legumes sob medida para restaurantes, eventos e famílias.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a 
                href="https://wa.me/244936953381?text=Ol%C3%A1,%20gostaria%20de%20fazer%20uma%20encomenda%20personalizada%20no%20Mercado%2030" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#f4a261] hover:bg-[#e76f51] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Completo */}
      <footer className="bg-[#11241c] text-gray-300 pt-16 pb-8 border-t border-emerald-950 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/95 p-2 px-3 rounded-2xl inline-block shadow-sm">
                <img 
                  src="/logo-transparent.png" 
                  alt="30 Express - Alimentos Saudáveis & Naturais" 
                  className="h-12 w-auto object-contain" 
                />
              </div>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                Plataforma oficial de delivery do <strong>Mercado 30</strong> em Luanda. Conectamos você aos produtores locais de alimentos saudáveis, naturais, carnes frescas e hortifrutigranjeiros com entrega expressa.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-[#52b788] transition cursor-pointer">📘</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-[#52b788] transition cursor-pointer">📸</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-[#52b788] transition cursor-pointer">💬</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-emerald-400">
                Departamentos
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setSelectedCategory('carnes')} className="hover:text-white transition">🥩 Carnes Frescas</button></li>
                <li><button onClick={() => setSelectedCategory('verduras')} className="hover:text-white transition">🥬 Verduras & Folhas</button></li>
                <li><button onClick={() => setSelectedCategory('frutas')} className="hover:text-white transition">🍎 Frutas da Época</button></li>
                <li><button onClick={() => setSelectedCategory('chas')} className="hover:text-white transition">🍵 Chás Medicinais</button></li>
                <li><button onClick={() => setSelectedCategory('legumes')} className="hover:text-white transition">🥕 Legumes & Raízes</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-emerald-400">
                Atendimento
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#f4a261]" />
                  <span>+244 936 953 381</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#f4a261]" />
                  <span>contato@30express.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#f4a261]" />
                  <span>Seg - Sáb: 7h às 21h</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-emerald-400">
                Localização
              </h4>
              <p className="text-sm text-gray-400 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#52b788] mt-1 flex-shrink-0" />
                <span>Mercado 30, Luanda, Angola</span>
              </p>
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-emerald-200">
                🌱 Produtos frescos selecionados diariamente às primeiras horas da manhã.
              </div>
            </div>

          </div>

          <div className="border-t border-emerald-950/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 30 Express - Alimentos Saudáveis & Naturais. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <span className="hover:text-gray-400 cursor-pointer">Termos de Uso</span>
              <span>•</span>
              <span className="hover:text-gray-400 cursor-pointer">Privacidade</span>
              <span>•</span>
              <span className="hover:text-gray-400 cursor-pointer">Entregas no Mercado 30</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal / Drawer do Carrinho */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden">
            
            <div className="p-5 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-[#74c69d]" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Meu Carrinho</h3>
                  <p className="text-xs text-emerald-200">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'} selecionados</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCart(false)} 
                className="p-1.5 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#f2f7f4] flex items-center justify-center mx-auto text-3xl">
                    🧺
                  </div>
                  <h4 className="font-bold text-gray-800">Seu carrinho está vazio</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Navegue pelas categorias e adicione produtos frescos do Mercado 30 para receber em sua casa.
                  </p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-2 px-6 py-2 bg-[#2d6a4f] text-white rounded-full text-xs font-semibold hover:bg-[#1b4332] transition"
                  >
                    Começar a Comprar
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-[#fbf9f5] border border-[#e8efe9] rounded-2xl p-3 hover:shadow-xs transition">
                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🌿</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.weight || item.category}</p>
                      <p className="text-xs font-bold text-[#2d6a4f] mt-0.5">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-[#d8e5db] rounded-full p-1 shadow-xs">
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-[#2d6a4f] font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-gray-700">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(item)} 
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-[#2d6a4f] font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-[#e8efe9] bg-[#fbf9f5] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Subtotal</span>
                  <span className="text-xl font-extrabold text-[#1b4332]">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                <button 
                  onClick={goToCheckout} 
                  className="w-full py-3.5 bg-[#f4a261] hover:bg-[#e76f51] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {user ? 'Finalizar Pedido Agora' : 'Cadastrar / Entrar para Finalizar'}
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

function ProductCard({ 
  product, 
  viewMode, 
  isFavorite, 
  onToggleFavorite, 
  onAddToCart,
  formatPrice 
}: {
  product: Product;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: (p: Product) => void;
  formatPrice: (v: number) => string;
}) {
  const isOrganic = product.is_organic;
  const inStock = product.in_stock !== false && (product.stock === undefined || product.stock > 0);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-[#e8efe9] overflow-hidden flex flex-col sm:flex-row items-center p-4 gap-4 group">
        <div className="w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-[#f0f7f3] relative flex-shrink-0 flex items-center justify-center">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <span className="text-5xl text-gray-300">🌿</span>
          )}
          {isOrganic && (
            <span className="absolute top-2 left-2 bg-[#2d6a4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Leaf className="w-2.5 h-2.5" />
              Orgânico
            </span>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#52b788] uppercase tracking-wider">
                {product.category}
              </span>
              <button 
                onClick={onToggleFavorite}
                className="text-gray-300 hover:text-red-500 transition"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{product.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <span className="text-lg font-extrabold text-[#1b4332]">
                {formatPrice(product.price)}
              </span>
              {product.weight && (
                <span className="text-xs text-gray-500 ml-1.5">/ {product.weight}</span>
              )}
            </div>
            <button
              onClick={() => onAddToCart(product)}
              disabled={!inStock}
              className="px-5 py-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full font-semibold text-xs flex items-center gap-1.5 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {inStock ? 'Adicionar' : 'Esgotado'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-natural-lg transition-all duration-300 border border-[#e8efe9] overflow-hidden flex flex-col group hover:-translate-y-1">
      <div className="relative h-48 sm:h-52 bg-[#f4f7f5] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
            🌿
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {isOrganic && (
            <span className="bg-[#1b4332]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#74c69d]" />
              Orgânico
            </span>
          )}
          {product.weight && (
            <span className="bg-[#f4a261] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              {product.weight}
            </span>
          )}
        </div>

        <button 
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition z-10"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {!inStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="bg-white text-gray-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#52b788] uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#f4a261] text-[#f4a261]" />
              <span className="text-xs font-bold text-gray-700">{product.rating || 4.9}</span>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-[#2d6a4f] transition-colors">
            {product.name}
          </h3>
          
          <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {product.description || 'Alimento fresco e selecionado de qualidade do Mercado 30.'}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Preço</p>
            <p className="text-base sm:text-lg font-extrabold text-[#1b4332]">
              {formatPrice(product.price)}
            </p>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={!inStock}
            className="px-4 py-2 bg-[#2d6a4f] hover:bg-[#1b4332] active:scale-95 text-white rounded-full font-bold text-xs flex items-center gap-1.5 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {inStock ? 'Comprar' : 'Indisponível'}
          </button>
        </div>
      </div>
    </div>
  );
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Peito de Frango Fresco do Campo',
    description: 'Peito de frango limpo sem pele, 100% fresco, macio e ideal para refeições saudáveis.',
    price: 2500,
    image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    category: 'carnes',
    store_id: '1',
    rating: 4.9,
    reviews: 142,
    is_organic: true,
    stock: 15,
    in_stock: true,
    weight: '1 kg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Alcatra Bovina Selecionada',
    description: 'Corte nobre e suculento de carne bovina fresca, perfeito para bifes e grelhados.',
    price: 5600,
    image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80',
    category: 'carnes',
    store_id: '1',
    rating: 4.8,
    reviews: 89,
    is_organic: false,
    stock: 8,
    in_stock: true,
    weight: '1 kg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Alface Americana Hidropônica',
    description: 'Folhas crocantes, lavadas e colhidas na madrugada para máxima frescura e hidratação.',
    price: 450,
    image_url: 'https://images.unsplash.com/photo-1622206151226-18ea2c1e7bae?w=500&auto=format&fit=crop&q=80',
    category: 'verduras',
    store_id: '1',
    rating: 5.0,
    reviews: 110,
    is_organic: true,
    stock: 25,
    in_stock: true,
    weight: '1 un',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Abacate Tropical Maduro',
    description: 'Abacate cremoso rico em gorduras boas e ômega, excelente para saladas e vitaminas.',
    price: 600,
    image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80',
    category: 'frutas',
    store_id: '1',
    rating: 4.9,
    reviews: 134,
    is_organic: true,
    stock: 20,
    in_stock: true,
    weight: '1 un',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Chá Verde & Hortelã Orgânica',
    description: 'Blend revigorante de folhas de chá verde natural com hortelã fresca desidratada.',
    price: 1200,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
    category: 'chas',
    store_id: '1',
    rating: 4.9,
    reviews: 76,
    is_organic: true,
    stock: 30,
    in_stock: true,
    weight: '150g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Cenouras Baby Frescas',
    description: 'Cenouras doces e crocantes, ricas em betacaroteno e vitaminas essenciais.',
    price: 850,
    image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80',
    category: 'legumes',
    store_id: '1',
    rating: 4.7,
    reviews: 62,
    is_organic: true,
    stock: 18,
    in_stock: true,
    weight: '500g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Ovos Caipiras do Campo',
    description: 'Dúzia de ovos vermelhos legítimos caipiras, gemas amarelas e sabor autêntico.',
    price: 2200,
    image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80',
    category: 'ovos',
    store_id: '1',
    rating: 5.0,
    reviews: 95,
    is_organic: true,
    stock: 12,
    in_stock: true,
    weight: '12 un',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Laranja Doce Selecionada',
    description: 'Laranjas suculentas e cheias de caldo, ideais para suco natural diário.',
    price: 1100,
    image_url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80',
    category: 'frutas',
    store_id: '1',
    rating: 4.8,
    reviews: 84,
    is_organic: true,
    stock: 22,
    in_stock: true,
    weight: '1 kg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
