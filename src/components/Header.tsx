import React from 'react';
import { ShoppingBag, MapPin, Clock, ShieldCheck, Bike, MessageCircle, Moon, Sun, LogOut } from 'lucide-react';
import { StoreSettings, User } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAI: () => void;
  onOpenAdmin: () => void;
  onOpenRider: () => void;
  onOpenTracker: () => void;
  hasActiveOrders: boolean;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  user: User | null;
  onLogout: () => void;
}

export default function Header({
  settings,
  cartCount,
  onOpenCart,
  onOpenAI,
  onOpenAdmin,
  onOpenRider,
  onOpenTracker,
  hasActiveOrders,
  theme,
  setTheme,
  user,
  onLogout
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Status Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 transform hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-lg sm:text-xl tracking-tighter">LB</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center">
                lanche<span className="text-rose-600">bem</span>
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Aberto
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">•</span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-rose-500" />
                  30-50 min
                </span>
              </div>
            </div>
          </div>

          {/* Quick Location Badge (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center space-x-2 text-xs bg-zinc-100 dark:bg-zinc-850 py-1.5 px-3 rounded-full text-zinc-600 dark:text-zinc-300 max-w-xs xl:max-w-md truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá - MA</span>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            
            {/* Quick tracker status pointer if active orders */}
            {hasActiveOrders && (
              <button
                onClick={onOpenTracker}
                className="relative p-2 text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors"
                title="Acompanhar Pedido Adotado"
                id="header-tracker-btn"
              >
                <Bike className="w-5 h-5 animate-bounce" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              </button>
            )}

            {/* Smart chatbot Support */}
            <button
              onClick={onOpenAI}
              className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
              title="Atendente Inteligente"
              id="header-ai-btn"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 h-5 animate-pulse" />
              <span className="hidden sm:inline text-zinc-700 dark:text-zinc-300">Falar com Chef</span>
            </button>

            {/* Dark & Light toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              title="Alternar Tema"
              id="header-theme-btn"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </button>

            {/* Rider quick hub - only for admins */}
            {user?.role === 'admin' && (
              <button
                onClick={onOpenRider}
                className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors hidden sm:block"
                title="Área do Entregador"
                id="header-rider-btn"
              >
                <Bike className="w-5 h-5" />
              </button>
            )}

            {/* Admin entry point - only for admins */}
            {user?.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                title="Painel Administrativo"
                id="header-admin-btn"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}

            {/* Cart trigger button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 sm:p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md hover:shadow-rose-500/20 shadow-rose-600/10 transition-all flex items-center space-x-1 sm:space-x-2"
              id="header-cart-btn"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">{cartCount}</span>
            </button>

            {/* Google User Avatar Profile & Disconnect button */}
            {user && (
              <div className="flex items-center space-x-2 border-l border-zinc-200 dark:border-zinc-850 pl-3">
                <img 
                  src={user.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-rose-500 bg-rose-100 dark:bg-zinc-950 shadow-sm"
                  title={`${user.name} (${user.email})`}
                />
                <div className="hidden md:flex flex-col text-left max-w-[100px]">
                  <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 truncate leading-none mb-0.5">{user.name}</span>
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold leading-none uppercase tracking-wide">
                    {user.role === 'admin' ? 'Admin' : 'Google Mail'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 transition-colors"
                  title="Sair / Desconectar"
                  id="header-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sub-Header Location for mobile devices */}
      <div className="flex lg:hidden bg-zinc-50 dark:bg-zinc-950 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 items-center space-x-2 text-[11px] text-zinc-500 dark:text-zinc-400 tracking-tight transition-colors">
        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span className="truncate">Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá</span>
      </div>
    </header>
  );
}
