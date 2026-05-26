import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame, Sparkles, Layers, ChefHat, CupSoda, MapPin, Clock, Search,
  ShoppingBag, MessageCircle, Star, Compass, ArrowUpRight
} from 'lucide-react';
import { Product, Category, CartItem, StoreSettings } from './types';
import Header from './components/Header';
import Banner from './components/Banner';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import Cart from './components/Cart';
import ChatAI from './components/ChatAI';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import RiderPanel from './components/RiderPanel';

const DEFAULT_SETTINGS: StoreSettings = {
  name: "Lanchebem",
  phone: "99984545370",
  address: "Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá - MA",
  deliveryFee: 5.00,
  isOpen: true,
  pixKey: "99984545370",
  pixReceiverName: "Lanchebem",
  pixCity: "Coroata",
  coupons: [],
  customBanners: []
};

export default function App() {
  // Theme Toggle Dark/Light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lanchebem_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('lanchebem_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Public Catalog Store states
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart Local Storage Sync states
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('lanchebem_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lanchebem_cart', JSON.stringify(cart));
  }, [cart]);

  // Active tracked order state
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    return localStorage.getItem('lanchebem_active_order_id') || null;
  });

  useEffect(() => {
    if (activeOrderId) {
      localStorage.setItem('lanchebem_active_order_id', activeOrderId);
    } else {
      localStorage.removeItem('lanchebem_active_order_id');
    }
  }, [activeOrderId]);

  const [hasScrolled, setHasScrolled] = useState(false);

  // Sheet Modal Toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'dashboard' | 'orders' | 'products' | 'settings' | 'deliveries'>('dashboard');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  const handleOpenAdminWithTab = (tab: 'dashboard' | 'orders' | 'products' | 'settings' | 'deliveries') => {
    setAdminInitialTab(tab);
    setIsAdminOpen(true);
  };
  const [selectedCustomizeProduct, setSelectedCustomizeProduct] = useState<Product | null>(null);

  // Sync products and settings from server
  const loadStoreData = async () => {
    try {
      const infoRes = await fetch('/api/public/store-info');
      if (infoRes.ok) {
        setSettings(await infoRes.json());
      }
      const prodRes = await fetch('/api/public/products');
      if (prodRes.ok) {
        const data = await prodRes.json();
        setCategories(data.categories || []);
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to sync store info', err);
    }
  };

  useEffect(() => {
    loadStoreData();

    // Track vertical scrolling state for bottom checkout float bar
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEO Schema Markup structured data mapping (Google crawls)
  useEffect(() => {
    const schemaJSON = {
      "@context": "https://schema.org",
      "@type": "FastFoodRestaurant",
      "name": "Lanchebem",
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
      "telephone": "+5599984545370",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Segunda Travessa São Rafael s/n",
        "addressLocality": "Coroatá",
        "addressRegion": "MA",
        "addressCountry": "BR"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "17:00",
        "closes": "23:59"
      }
    };

    const existingScript = document.getElementById('json-ld-schema-lanchebem');
    if (existingScript) {
      existingScript.remove();
    }
    const script = document.createElement('script');
    script.id = 'json-ld-schema-lanchebem';
    script.type = 'application/javascript+jsonld';
    script.innerHTML = JSON.stringify(schemaJSON);
    document.head.appendChild(script);
  }, [settings]);

  // Cart manipulators
  const handleAddToCart = (newItem: CartItem) => {
    setCart((prev) => {
      // Analyze matching unique items with identical sizing / options to aggregate cleanly
      const isMatch = (item: CartItem) =>
        item.product.id === newItem.product.id &&
        item.selectedSize?.id === newItem.selectedSize?.id &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(newItem.selectedOptions);

      const matchIdx = prev.findIndex(isMatch);
      if (matchIdx !== -1) {
        const nextCart = [...prev];
        nextCart[matchIdx].quantity += newItem.quantity;
        return nextCart;
      }
      return [...prev, newItem];
    });
  };

  const handleUpdateCartQuantity = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(idx);
      return;
    }
    setCart((prev) => {
      const nextCart = [...prev];
      nextCart[idx].quantity = newQty;
      return nextCart;
    });
  };

  const handleRemoveCartItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSelectProductToCustomize = (product: Product) => {
    setSelectedCustomizeProduct(product);
  };

  // Static Lucide Icons mapper helper
  const getCategoryIconSymbol = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4 sm:w-5 h-5 text-rose-550" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 sm:w-5 h-5 text-amber-500" />;
      case 'Layers': return <Layers className="w-4 h-4 sm:w-5 h-5 text-amber-600" />;
      case 'ChefHat': return <ChefHat className="w-4 h-4 sm:w-5 h-5 text-orange-600" />;
      case 'CupSoda': return <CupSoda className="w-4 h-4 sm:w-5 h-5 text-blue-500" />;
      default: return <Compass className="w-4 h-4 sm:w-5 h-5" />;
    }
  };

  // Perform filtering elements
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartItemsCount = cart.reduce((add, next) => add + next.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const sizeAdjust = item.selectedSize ? item.selectedSize.priceAdjustment : 0;
    const optsAddition = item.selectedOptions.reduce((oSum, o) => oSum + o.price, 0);
    return sum + (item.product.price + sizeAdjust + optsAddition) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 flex flex-col font-sans select-none antialiased">
      
      {/* Sticky and Responsive Header */}
      <Header
        settings={settings}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenAdmin={() => handleOpenAdminWithTab('dashboard')}
        onOpenRider={() => handleOpenAdminWithTab('deliveries')}
        onOpenTracker={() => setIsTrackerOpen(true)}
        hasActiveOrders={!!activeOrderId}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Container screen blocks */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-center pb-24 sm:pb-32">
        
        {/* Banner with Framer Motion slides */}
        <Banner banners={settings.customBanners && settings.customBanners.length ? settings.customBanners : []} />

        {/* Dynamic Categories Selector Row */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-650 dark:text-zinc-350 flex items-center gap-1.5">
              <span>Categorias:</span>
            </h3>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none custom-scrollbar" id="category-scroller-row">
            {/* Clear All Categories option */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-3.5 px-5.5 rounded-2xl flex items-center space-x-2 text-xs sm:text-sm font-extrabold border transition shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/15'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100/50'
              }`}
              id="category-tab-all"
            >
              <span>⭐</span>
              <span>Todos</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3.5 px-5.5 rounded-2xl flex items-center space-x-2 text-xs sm:text-sm font-extrabold border transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/15'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100/50'
                }`}
                id={`category-tab-${cat.id}`}
              >
                <span>{getCategoryIconSymbol(cat.icon)}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Smart Search filter Row (Mobile-safe input spacing) */}
        <section className="space-y-3.5">
          <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 p-1.5 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm focus-within:border-rose-450 focus-within:ring-1 focus-within:ring-rose-455 transition duration-200">
            <div className="flex items-center space-x-2.5 px-2">
              <Search className="w-5 h-5 text-rose-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qual lanche vamos saborear hoje?"
                className="flex-1 text-xs sm:text-sm p-1.5 focus:outline-none dark:text-zinc-200 font-medium"
                id="search-input"
              />
            </div>
          </div>
        </section>

        {/* Dynamic Catalog Section */}
        <section className="space-y-6">
          <div className="text-left border-b pb-2 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
              <span>Cardápio Especial</span>
              <span className="text-xs font-bold leading-none bg-rose-500/10 text-rose-600 dark:text-rose-450 px-2.5 py-1 rounded-full border border-rose-500/10 uppercase tracking-widest shrink-0">
                {selectedCategory === 'all' ? 'Ver Tudo' : categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            </h2>
            <span className="text-xs font-bold text-zinc-400 capitalize">{filteredProducts.length} itens encontrados</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <AnimatePresence>
              {filteredProducts.map((prod) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard
                    product={prod}
                    onSelect={handleSelectProductToCustomize}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-zinc-400 text-center space-y-1.5">
                <span className="text-4xl">🍔</span>
                <p className="text-sm font-semibold">Nenhum hambúrguer ou bebida encontrado.</p>
                <p className="text-xs max-w-sm">Tente limpar sua pesquisa ou redefinir a categoria.</p>
              </div>
            )}
          </div>
        </section>

        {/* Location Informative Footer Banner representing Lanchebem */}
        <section className="bg-zinc-100 dark:bg-zinc-950/60 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-5 text-left shadow-sm">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center space-x-1.5 text-xs text-rose-500 font-bold uppercase tracking-widest">
              <MapPin className="w-4 h-4 animate-bounce" />
              <span>Visite-nos em Coroatá</span>
            </div>
            <h4 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
              Lanchonete Lanchebem na sua vizinhança!
            </h4>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              Estamos prontos para preparar os melhores e mais suculentos hambúrgueres artesanais da região. Nosso ponto físico de atendimento fica na <strong className="text-zinc-800 dark:text-zinc-200">Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá - MA</strong>. Aceitamos retirada ou enviamos para o seu endereço em minutos!
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=Segunda+Travessa+Sao+Rafael+sn+Mariol+Coroata+Maranhao"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 px-6 shrink-0 rounded-2xl bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 hover:shadow-lg transition-transform active:scale-95 text-center w-full sm:w-auto"
          >
            <span>Ver no GPS Maps</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>

      </main>

      {/* Floating Checkout bottom bar when scrolled on Desktop/Mobile */}
      {hasScrolled && cartItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto animate-fade-in sm:inset-x-auto sm:right-6">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 bg-green-600 hover:bg-green-700 font-extrabold text-white text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-xl shadow-green-500/20 active:scale-95 transition-all"
            id="floating-checkout-btn"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 animate-bounce" />
              <span>Completar meu Pedido ({cartItemsCount})</span>
            </span>
            <span className="bg-green-700 px-3 py-1 rounded-xl block font-black text-xs sm:text-sm text-white shadow-inner">
              R$ {cartSubtotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Interactive Support floating trigger index */}
      {!isAIOpen && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-4 left-4 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xl flex items-center justify-center border border-rose-500/10 select-none animate-bounce"
          id="chat-ai-trigger"
          title="Falar com Chef Virtual"
        >
          <MessageCircle className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* FOOTER SHEETS, MODALS AND CONTROLLERS INDEX */}

      {/* Product customization modal overlay */}
      <ProductModal
        product={selectedCustomizeProduct}
        onClose={() => setSelectedCustomizeProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout cart Drawer panel */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        settings={settings}
        onClearCart={handleClearCart}
        onOrderSuccess={(id) => {
          setActiveOrderId(id);
          setIsTrackerOpen(true);
        }}
      />

      {/* Conversational support panel chatbot */}
      <ChatAI
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        storePhone={settings.phone}
      />

      {/* Customer Tracking Details status */}
      {isTrackerOpen && (
        <OrderTracker
          orderId={activeOrderId}
          onClose={() => setIsTrackerOpen(false)}
        />
      )}

      {/* Back-Office control panels admin portal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        settings={settings}
        onUpdateProducts={loadStoreData}
        onUpdateSettings={loadStoreData}
        initialTab={adminInitialTab}
      />

    </div>
  );
}
