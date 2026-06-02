import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ArrowRight, Lock, Key } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  theme: 'light' | 'dark';
}

export default function LoginScreen({ onLoginSuccess, theme }: LoginScreenProps) {
  const [showAdminLogin, setShowAdminLogin] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'admin' || params.get('admin') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  // Background Falling Espetinhos (Skewers) & Ingredients
  const fallingItems = React.useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => {
      const items = ['🍢', '🥩', '🍖', '🧅', '🍅', '🔥'];
      const emoji = items[i % items.length];
      return {
        id: i,
        emoji,
        left: `${(i * 4.7 + Math.random() * 3) % 96}%`,
        delay: i * 0.45,
        duration: 9 + Math.random() * 8,
        size: 20 + Math.random() * 16,
        rotateStart: Math.random() * 360,
        rotateEnd: Math.random() * 720 + 360,
        depth: i % 3 === 0 ? 'z-20 pointer-events-none' : 'z-0 pointer-events-none'
      };
    });
  }, []);

  // Bottom Flames & Rising Sparks / Embers Particles
  const emberParticles = React.useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${(i * 3 + Math.random() * 2.5) % 100}%`,
      delay: Math.random() * 5.5,
      duration: 4 + Math.random() * 5,
      size: 3 + Math.random() * 4,
      driftX: (Math.random() - 0.5) * 140,
    }));
  }, []);
  
  // Loading state when accessing customer menu
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Admin login states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleToggleAdmin = () => {
    try {
      const adminUrl = new URL(window.location.href);
      adminUrl.searchParams.set('mode', 'admin');
      window.open(adminUrl.toString(), '_blank');
    } catch (e) {
      console.warn("Could not open admin login in new tab:", e);
    }
    setShowAdminLogin(true);
  };

  const handleGuestAccess = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      onLoginSuccess({
        email: 'cliente@lanchebem.com.br',
        name: 'Cliente Lanchebem',
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=LanchebemCliente`,
        role: 'customer'
      });
      setIsSigningIn(false);
    }, 850);
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsAdminLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('lanchebem_admin_token', data.token);
        onLoginSuccess({
          email: 'admin@lanchebem.com.br',
          name: 'Administrador Lanchebem',
          photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=admin`,
          role: 'admin'
        });
      } else {
        setAdminError(data.error || 'Autenticação de administrador falhou.');
      }
    } catch (err) {
      setAdminError('Problema ao conectar com o serviço de segurança.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 select-none font-sans text-center">
      {/* Decorative blurred background circles for modern look */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Falling Espetinhos & Ingredients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {fallingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: '-10%', x: 0, rotate: item.rotateStart, opacity: 0 }}
            animate={{
              y: '115vh',
              x: [0, 30, -30, 0],
              rotate: item.rotateEnd,
              opacity: [0, 0.85, 0.85, 0]
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
            className={`absolute ${item.depth}`}
            style={{
              left: item.left,
              fontSize: `${item.size}px`,
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
            }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </div>

      {/* Bottom Glowing Fire & Lava Pit Zone */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none overflow-hidden z-10">
        {/* Glow backdrop */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130%] h-28 bg-gradient-to-t from-orange-600/35 to-transparent blur-3xl" />

        {/* Back Deep Red/Orange Flame */}
        <motion.div
          animate={{
            scaleY: [1, 1.25, 0.9, 1.15, 1],
            skewX: [-4, 3, -1, 4, -4],
            borderRadius: ["40% 40% 0 0", "50% 30% 0 0", "30% 50% 0 0", "40% 40% 0 0"]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-[-15px] left-[-15%] w-[130%] h-24 bg-rose-600/30 rounded-[50%_50%_0_0] blur-md mix-blend-screen origin-bottom"
        />

        {/* Mid Vibrant Orange Flame */}
        <motion.div
          animate={{
            scaleY: [1.15, 0.85, 1.2, 0.95, 1.15],
            skewX: [4, -3, 2, -2, 4],
            borderRadius: ["45% 45% 0 0", "35% 55% 0 0", "55% 35% 0 0", "45% 45% 0 0"]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-[-8px] left-[-8%] w-[116%] h-18 bg-amber-500/40 rounded-[50%_50%_0_0] blur-sm mix-blend-screen origin-bottom"
        />

        {/* Front Active Yellow Hot Flame */}
        <motion.div
          animate={{
            scaleY: [0.92, 1.18, 1, 1.12, 0.92],
            skewX: [-2, 2, -2, 2, -2],
            borderRadius: ["50% 50% 0 0", "45% 55% 0 0", "55% 45% 0 0", "50% 50% 0 0"]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-0 left-0 w-full h-14 bg-yellow-500/45 rounded-[50%_50%_0_0] blur-[2px] mix-blend-screen origin-bottom"
        />

        {/* Golden Lava Base Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-rose-700 via-orange-600 to-yellow-500 opacity-90 blur-[1px]" />
      </div>

      {/* Rising Lava Sparks & Embers Particles */}
      <div className="absolute bottom-0 left-0 right-0 h-screen overflow-hidden pointer-events-none z-10">
        {emberParticles.map((ember) => (
          <motion.div
            key={ember.id}
            initial={{ y: '105vh', x: 0, scale: 0.7, opacity: 0 }}
            animate={{
              y: '-10vh',
              x: [0, ember.driftX * 0.35, ember.driftX, ember.driftX * 0.75],
              opacity: [0, 0.95, 0.8, 0],
              scale: [0.7, 1.25, 0.9, 0.4]
            }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            className="absolute bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 rounded-full shadow-[0_0_7px_#f59e0b]"
            style={{
              left: ember.left,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-30 w-full max-w-md p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-8"
      >
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-rose-500/20 bg-rose-100 dark:bg-rose-950/20 p-0.5 border border-rose-500/20">
            <img 
              src="https://i.ibb.co/NnxjzwRT/Chat-GPT-Image-26-de-mai-de-2026-16-20-08.png" 
              alt="Lanchebem Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              lanche<span className="text-rose-600">bem</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              O churrasco e os lanches mais saborosos de Coroatá
            </p>
          </div>
        </div>

        {/* Dynamic Forms Switch */}
        <AnimatePresence mode="wait">
          {!showAdminLogin ? (
            <motion.div
              key="customer-login-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Promo Banner inside login */}
              <div className="p-4 bg-gradient-to-br from-amber-500/5 via-rose-500/5 to-rose-500/10 border border-rose-500/10 rounded-2xl text-left">
                <span className="text-[10px] font-black uppercase text-rose-650 dark:text-rose-450 tracking-wider block mb-1">🔥 Churrasco & Cia</span>
                <p className="text-xs font-semibold text-zinc-750 dark:text-zinc-250 leading-relaxed">
                  Consulte nosso cardápio virtual completo, monte seu carrinho, receba em casa ou agende sua retirada com facilidade!
                </p>
              </div>

              {/* Login buttons container */}
              <div className="space-y-3">
                <button
                  onClick={handleGuestAccess}
                  disabled={isSigningIn}
                  className="w-full h-14 bg-gradient-to-r from-orange-600 via-rose-600 to-red-650 hover:from-orange-500 hover:via-rose-500 hover:to-red-550 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-rose-600/25 dark:shadow-none transition-all duration-200 active:scale-98 cursor-pointer relative overflow-hidden"
                  id="access-menu-btn"
                >
                  <Flame className="w-5 h-5 animate-pulse shrink-0 text-amber-300" />
                  <span>{isSigningIn ? 'Acessando...' : 'Acesse nossa página do Espetinho Lanche Bem'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  onClick={handleToggleAdmin}
                  className="text-xs font-bold text-rose-655 dark:text-rose-405 flex items-center justify-center gap-1.5 mx-auto hover:underline"
                  id="toggle-admin-login-link"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Acesso Administrativo / Portaria</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin-login-view"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 text-left"
            >
              <div className="flex items-center gap-2 border-b pb-2 mb-3">
                <Lock className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                  Controle de Segurança Interna
                </h4>
              </div>

              {adminError && (
                <div className="p-3 bg-red-100/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                  {adminError}
                </div>
              )}

              <form onSubmit={handleAdminFormSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1 tracking-wide">
                    Usuário Operacional
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Ex: admin"
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1 tracking-wide">
                    Senha de Segurança
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="flex-1 p-2.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isAdminLoading}
                    className="flex-1 p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
                    id="admin-login-submit"
                  >
                    {isAdminLoading ? 'Verificando...' : 'Entrar'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
