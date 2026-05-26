import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ArrowRight, Lock, Key, Mail, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  theme: 'light' | 'dark';
}

export default function LoginScreen({ onLoginSuccess, theme }: LoginScreenProps) {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
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
  
  // Google sign in states
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Admin login states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Preset Google Accounts for quick simulation testing
  const presetGoogleAccounts = [
    { name: 'Coroatá Maranhão CTA', email: 'coroata.maranhao.cta@gmail.com', avatarBg: 'bg-emerald-600' },
    { name: 'Ana Silva', email: 'anasilva.ma@gmail.com', avatarBg: 'bg-indigo-600' },
  ];

  const handlePresetGoogleClick = (preset: typeof presetGoogleAccounts[0]) => {
    setIsSigningIn(true);
    setGoogleError('');
    
    setTimeout(() => {
      onLoginSuccess({
        email: preset.email,
        name: preset.name,
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${preset.name}`,
        role: 'customer'
      });
      setIsSigningIn(false);
      setShowGoogleModal(false);
    }, 1200);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError('');

    if (!googleEmail) {
      setGoogleError('Por favor, informe seu e-mail do Google.');
      return;
    }
    if (!googleEmail.toLowerCase().endsWith('@gmail.com') && !googleEmail.toLowerCase().includes('@')) {
      setGoogleError('Por favor, digite um endereço de e-mail válido (ex: seuemail@gmail.com).');
      return;
    }

    const finalName = googleName.trim() || googleEmail.split('@')[0];
    const capitalizedName = finalName.charAt(0).toUpperCase() + finalName.slice(1);

    setIsSigningIn(true);
    setTimeout(() => {
      onLoginSuccess({
        email: googleEmail.toLowerCase(),
        name: capitalizedName,
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${finalName}`,
        role: 'customer'
      });
      setIsSigningIn(false);
      setShowGoogleModal(false);
    }, 1500);
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
              className="space-y-5"
            >
              {/* Promo Banner inside login */}
              <div className="p-3.5 bg-gradient-to-br from-amber-500/5 to-rose-500/10 border border-rose-500/10 rounded-2xl text-left">
                <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider block mb-1">🔥 Atendimento Iniciado</span>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Faça login rápido com sua conta Google para liberar acesso ao menu, carrinho, chat do Chef e acompanhamento de pedidos!
                </p>
              </div>

              {/* Login buttons container */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full h-12 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-bold text-sm border border-zinc-200 dark:border-zinc-850 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:shadow transition-all duration-200 active:scale-98 cursor-pointer"
                  id="google-login-btn"
                >
                  {/* High Quality Authentic Google SVG icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="100%" height="100%">
                    <path
                      fill="#EA4335"
                      d="M12.0003 4.75c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.4503 1.44 14.9303 0 12.0003 0 7.3203 0 3.3203 2.69 1.4103 6.62l3.77 2.93c.9-2.69 3.4-4.8 6.82-4.8z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.46-1.11 2.7-2.35 3.53l3.65 2.83C21.88 18.73 23.49 15.78 23.49 12.27z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.18 14.45c-.23-.69-.37-1.42-.37-2.18s.14-1.49.37-2.18L1.41 7.15C.51 8.92 0 10.9 0 13s.51 4.08 1.41 5.85l3.77-2.9c0-.49-.1-.99-.1-1.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.0003 24c3.24 0 5.95-1.08 7.93-2.91l-3.65-2.83c-1.01.68-2.31 1.08-4.28 1.08-3.41 0-6.3-2.3-7.33-5.41l-3.79 2.93C3.0603 21.04 7.1003 24 12.0003 24z"
                    />
                  </svg>
                  <span>Entrar com o Google</span>
                </button>
              </div>

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-405 flex items-center justify-center gap-1.5 mx-auto hover:underline"
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

      {/* Elegant Authentic Simulated Google Sign-In Popup */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl space-y-5 text-left p-6"
            >
              {/* Google Modal Header */}
              <div className="flex flex-col items-center text-center space-y-1.5 pb-2 border-b">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  Fazer login com o Google
                </h3>
                <span className="text-[10px] bg-zinc-150 dark:bg-zinc-800 text-zinc-550 px-2 py-0.5 rounded-full font-bold">
                  lanchebem.com
                </span>
              </div>

              {googleError && (
                <div className="p-2.5 bg-red-100/15 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                  {googleError}
                </div>
              )}

              {/* Preset Accounts Picker */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-zinc-400 block tracking-wider mb-2">
                  Escolha uma conta para prosseguir:
                </span>
                
                <div className="space-y-1.5">
                  {presetGoogleAccounts.map((account) => (
                    <button
                      key={account.email}
                      disabled={isSigningIn}
                      onClick={() => handlePresetGoogleClick(account)}
                      className="w-full p-3 rounded-2xl flex items-center justify-between border hover:bg-zinc-50 dark:hover:bg-zinc-950/50 bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800 transition active:scale-98 text-left cursor-pointer disabled:opacity-40"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${account.avatarBg}`}>
                          {account.name.split(' ')[0][0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-850 dark:text-zinc-105 leading-none">{account.name}</span>
                          <span className="text-[10px] text-zinc-450 mt-0.5">{account.email}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-350" />
                    </button>
                  ))}
                </div>
              </div>

              {/* OR Custom input form */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-white dark:bg-zinc-900 px-1">Ou digitar outra conta</span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                <div className="space-y-2.5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="seu.email@gmail.com"
                      required
                      disabled={isSigningIn}
                      className="w-full p-2.5 pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="Nome Completo (Opcional)"
                      disabled={isSigningIn}
                      className="w-full p-2.5 pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1 font-bold">
                  <button
                    type="button"
                    disabled={isSigningIn}
                    onClick={() => setShowGoogleModal(false)}
                    className="flex-1 p-2.5 bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs uppercase hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Calcelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="flex-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs uppercase flex items-center justify-center gap-1 shadow"
                  >
                    {isSigningIn ? 'Acessando...' : 'Próximo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
