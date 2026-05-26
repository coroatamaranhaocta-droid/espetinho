import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import {
  ShieldAlert, Lock, LogOut, LayoutDashboard, ShoppingBag, Plus, Trash2, Edit3, Settings,
  DollarSign, Check, X, Eye, FileText, Store, ChevronRight, Tag, Bell, RefreshCw, Bike
} from 'lucide-react';
import { Order, Product, Category, StoreSettings, DashboardStats } from '../types';
import RiderPanel from './RiderPanel';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onUpdateProducts: () => void;
  onUpdateSettings: () => void;
  initialTab?: 'dashboard' | 'orders' | 'products' | 'settings' | 'deliveries';
}

export default function AdminPanel({
  isOpen,
  onClose,
  products = [],
  categories = [],
  settings,
  onUpdateProducts,
  onUpdateSettings,
  initialTab
}: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab control inside admin
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'settings' | 'deliveries'>('dashboard');

  // Stats & States telemetry lists
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Products manager helper states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState(categories[0]?.id || 'burgers');
  const [pImage, setPImage] = useState('');
  const [pAvailable, setPAvailable] = useState(true);
  const [pPopular, setPPopular] = useState(false);

  // Store setting parameters forms
  const [sFee, setSFee] = useState(settings.deliveryFee.toString());
  const [sOpen, setSOpen] = useState(settings.isOpen);
  const [sPixKey, setSPixKey] = useState(settings.pixKey);
  const [sAddress, setSAddress] = useState(settings.address);
  
  // Coupon State within configuration settings
  const [couponCode, setCouponCode] = useState('');
  const [couponVal, setCouponVal] = useState('');
  const [couponMin, setCouponMin] = useState('');
  const [couponType, setCouponType] = useState<'fixed' | 'percentage'>('fixed');

  // Motoboy/Rider Registration State within settings
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderModel, setNewRiderModel] = useState('');
  const [newRiderPlate, setNewRiderPlate] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');

  const getAuthToken = () => localStorage.getItem('lanchebem_admin_token');

  // Load telemetry stats and historical orders if logged in
  const fetchDashboardStats = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      const ordersRes = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Perform administrative security login Checks
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('lanchebem_admin_token', data.token);
        setIsLoggedIn(true);
        fetchDashboardStats();
      } else {
        setLoginError(data.error || 'Autenticação falhou.');
      }
    } catch (err) {
      setLoginError('Problema ao contactar o servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lanchebem_admin_token');
    setIsLoggedIn(false);
  };

  // Auto verify active tokens on initial build
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsLoggedIn(true);
      fetchDashboardStats();
    }
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Update specific order status
  const handleUpdateOrderStatus = async (orderId: string, status: string, pixVerified?: boolean) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/order/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, pixVerified })
      });
      if (res.ok) {
        if (selectedOrderReceipt?.id === orderId) {
          setSelectedOrderReceipt(null);
        }
        fetchDashboardStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create or update item catalog elements
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    const payload = {
      name: pName,
      price: Number(pPrice),
      description: pDesc,
      category: pCategory,
      image: pImage || undefined,
      isAvailable: pAvailable,
      isPopular: pPopular
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        setPName('');
        setPPrice('');
        setPDesc('');
        setPImage('');
        onUpdateProducts();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name);
    setPPrice(p.price.toString());
    setPDesc(p.description);
    setPCategory(p.category);
    setPImage(p.image);
    setPAvailable(p.isAvailable);
    setPPopular(!!p.isPopular);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onUpdateProducts();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings modify
  const handleSaveSettings = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryFee: Number(sFee),
          isOpen: sOpen,
          pixKey: sPixKey,
          address: sAddress
        })
      });
      if (res.ok) {
        onUpdateSettings();
        alert('Configurações salvas com sucesso!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Coupons modifier actions within configuration panel
  const handleAddCouponSettingOrder = async () => {
    if (!couponCode || !couponVal) return;
    const token = getAuthToken();
    const newCoupon = {
      code: couponCode.toUpperCase(),
      discountType: couponType,
      value: Number(couponVal),
      minOrderValue: couponMin ? Number(couponMin) : undefined
    };

    const updatedCoupons = [...(settings.coupons || []), newCoupon];

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coupons: updatedCoupons })
      });
      if (res.ok) {
        onUpdateSettings();
        setCouponCode('');
        setCouponVal('');
        setCouponMin('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCoupon = async (code: string) => {
    const token = getAuthToken();
    const updatedCoupons = settings.coupons?.filter((c) => c.code !== code) || [];
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coupons: updatedCoupons })
      });
      if (res.ok) {
        onUpdateSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Riders / Motoboys modifiers actions within configuration panel
  const handleAddRiderSetting = async () => {
    if (!newRiderName || !newRiderModel) {
      alert('Nome do entregador e modelo da moto são obrigatórios!');
      return;
    }
    const token = getAuthToken();
    const newRider = {
      id: 'rider_' + Date.now(),
      name: newRiderName,
      vehicleModel: newRiderModel,
      plate: newRiderPlate || undefined,
      phone: newRiderPhone || undefined
    };

    const updatedRiders = [...(settings.riders || []), newRider];

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riders: updatedRiders })
      });
      if (res.ok) {
        onUpdateSettings();
        setNewRiderName('');
        setNewRiderModel('');
        setNewRiderPlate('');
        setNewRiderPhone('');
        alert('Entregador cadastrado com sucesso!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveRider = async (id: string) => {
    const token = getAuthToken();
    const updatedRiders = settings.riders?.filter((r) => r.id !== id) || [];
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riders: updatedRiders })
      });
      if (res.ok) {
        onUpdateSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Color mappings for recharts cells
  const COLORS = ['#2563eb', '#ea580c', '#0284c7', '#16a34a', '#dc2626'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="admin-panel-modal">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-5xl bg-white dark:bg-zinc-900 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Draw Header bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between bg-zinc-905 bg-rose-600 text-white rounded-t-none">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center text-rose-100">
              🛡️
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-sm sm:text-base">Painel Administrativo</h3>
              <p className="text-[10px] text-rose-100 font-medium uppercase tracking-wider">Lanchebem Back-Office Controls</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-1 px-3 bg-rose-700 hover:bg-rose-850 rounded-xl font-bold text-[10px] flex items-center gap-1.5 uppercase transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-rose-700 text-rose-100 hover:text-white transition"
              id="admin-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Safeguard Lock Screen */}
        {!isLoggedIn ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950/40">
            <form onSubmit={handleLoginSubmit} className="w-full max-w-sm bg-white dark:bg-zinc-900 p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-3xl space-y-5 text-left">
              <div className="flex flex-col items-center justify-center text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-black text-zinc-909 dark:text-zinc-50">Acesso Restrito</h4>
                <p className="text-xs text-zinc-405 leading-none font-medium">Lanchebem Secret Key</p>
              </div>

              {loginError && (
                <p className="text-[11px] text-rose-600 text-center font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-500/10 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-600 block mb-1">Usuário</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuário administrador"
                    className="w-full p-2.5 border rounded-xl text-xs sm:text-sm bg-zinc-50 focus:outline-rose-500 text-zinc-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-60s block mb-1">Senha Secreta</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full p-2.5 border rounded-xl text-xs sm:text-sm bg-zinc-50 focus:outline-rose-500 text-zinc-905 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase"
              >
                Desbloquear Painel
              </button>
              
              <p className="text-[10px] text-zinc-400 text-center select-none pt-2 font-medium">
                Dica teste: Usuário <strong className="text-zinc-502 select-text">admin</strong> & Senha <strong className="text-zinc-502 select-text">lanchebem123</strong>
              </p>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar navigation */}
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 flex md:flex-col p-2.5 sm:p-4 gap-1 sm:gap-2 overflow-x-auto justify-start md:overflow-x-visible">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition w-full shrink-0 md:shrink ${
                  activeTab === 'dashboard'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900'
                }`}
                id="admin-tab-nav-dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition w-full shrink-0 md:shrink ${
                  activeTab === 'orders'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900'
                }`}
                id="admin-tab-nav-orders"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Controle Pedidos</span>
              </button>
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition w-full shrink-0 md:shrink ${
                  activeTab === 'deliveries'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900'
                }`}
                id="admin-tab-nav-deliveries"
              >
                <Bike className="w-4 h-4" />
                <span>Entregas (Motoboy)</span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition w-full shrink-0 md:shrink ${
                  activeTab === 'products'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900'
                }`}
                id="admin-tab-nav-products"
              >
                <Plus className="w-4 h-4" />
                <span>Produtos</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition w-full shrink-0 md:shrink ${
                  activeTab === 'settings'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900'
                }`}
                id="admin-tab-nav-settings"
              >
                <Settings className="w-4 h-4" />
                <span>Customização</span>
              </button>
            </div>

            {/* Content area blocks */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-left custom-scrollbar bg-zinc-50/60 dark:bg-zinc-950/20">
              
              {loading && (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
                </div>
              )}

              {/* DASHBOARD TAB CONTROLS */}
              {!loading && activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* Bento Statistics Grid indicators */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 border rounded-2xl shadow-sm flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center">
                        📋
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Total Pedidos</span>
                        <span className="text-xl font-black text-zinc-800 dark:text-zinc-50">{stats.totalOrders}</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 border rounded-2xl shadow-sm flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 flex items-center justify-center">
                        ✓
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Pedidos Pagos</span>
                        <span className="text-xl font-black text-zinc-800 dark:text-zinc-50">{stats.paidOrders}</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 border rounded-2xl shadow-sm flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center">
                        ⚡
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Pendentes</span>
                        <span className="text-xl font-black text-zinc-800 dark:text-zinc-50">{stats.pendingOrders}</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 border rounded-2xl shadow-sm flex items-center space-x-3.5 col-span-2 lg:col-span-1">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Faturado Hoje</span>
                        <span className="text-xl font-black text-zinc-805 dark:text-zinc-50">R$ {stats.dailyRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Telemetry Chart Analytics rows */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Area charts last 7 days revenue */}
                    <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-350">Histórico de Faturamento (R$)</h4>
                        <button onClick={fetchDashboardStats} className="p-1 text-zinc-400 hover:text-rose-550 transition-colors">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.revenueLast7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                            <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                            <Area type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Status pie chart distribution */}
                    <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-350">Distribuição por Status</h4>
                      
                      <div className="h-[150px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.ordersByStatus}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {stats.ordersByStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Total</span>
                          <span className="text-lg font-black text-zinc-800 dark:text-zinc-50">{stats.totalOrders}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        {stats.ordersByStatus.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-sm block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="truncate">{item.name} ({item.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTROL ORDERS TAB */}
              {!loading && activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                      📋 Painel Logístico de Pedidos
                    </h4>
                    <button onClick={fetchDashboardStats} className="p-1.5 bg-white border rounded-lg text-zinc-500 hover:text-rose-550 shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-10 font-medium">Nenhum pedido registrado no momento.</p>
                    ) : (
                      orders.map((o) => (
                        <div key={o.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm space-y-4">
                          
                          {/* Top metadata tags */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3">
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-rose-600">{o.id}</span>
                                <span className="text-xs text-zinc-400">•</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-100">{o.customerName}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                Criado em: {new Date(o.createdAt).toLocaleTimeString('pt-BR')} • {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 self-start sm:self-center">
                              {/* PIX Approval indicator indicator */}
                              {o.paymentMethod === 'PIX' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, o.status, !o.pixVerified)}
                                  className={`p-1.5 px-3 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1.2 tracking-wider ${
                                    o.pixVerified
                                      ? 'bg-green-50 text-green-700 dark:bg-green-950/40'
                                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                                  }`}
                                  title="Validar pagamento PIX"
                                >
                                  <span>{o.pixVerified ? '✓ PIX Confirmado' : '⚡ Validar PIX'}</span>
                                </button>
                              )}
                              
                              {/* Order main status selection slider */}
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                                className="p-1 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider bg-zinc-50 text-zinc-800 focus:ring-1 focus:ring-rose-500"
                              >
                                <option value="Recebido">Recebido</option>
                                <option value="Em preparo">Preparando</option>
                                <option value="Saiu para entrega">Enviado</option>
                                <option value="Entregue">Entregue</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </div>
                          </div>

                          {/* Items descriptions and Address breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="text-left space-y-2">
                              <span className="text-[9px] text-zinc-400 uppercase font-black block tracking-wider">Itens:</span>
                              <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 border border-zinc-150 rounded-xl space-y-1.5">
                                {o.items?.map((item, id) => (
                                  <div key={id} className="flex justify-between font-medium">
                                    <span>{item.quantity}x {item.productName} {item.selectedSize ? `(${item.selectedSize})` : ''}</span>
                                    <span className="font-extrabold text-zinc-800">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="border-t pt-1.5 flex justify-between font-black text-rose-600">
                                  <span>Faturamento total</span>
                                  <span>R$ {o.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left space-y-1.5 text-zinc-650 dark:text-zinc-350">
                              <span className="text-[9px] text-zinc-400 uppercase font-black block tracking-wider">Despacho:</span>
                              <p className="font-bold">Celular: <span className="select-all font-mono text-xs">{o.customerPhone}</span></p>
                              <p className="leading-relaxed">
                                {o.deliveryAddress.street}, N° {o.deliveryAddress.number} • Bairro {o.deliveryAddress.neighborhood}
                                {o.deliveryAddress.complement && ` (${o.deliveryAddress.complement})`}
                                {o.deliveryAddress.reference && ` \nRef: ${o.deliveryAddress.reference}`}
                              </p>
                              
                              {/* Open attachment visual lightbox */}
                              {o.receiptBase64 && (
                                <button
                                  onClick={() => setSelectedOrderReceipt(o)}
                                  className="p-1 px-3 bg-rose-50 text-rose-600 dark:bg-rose-950/40 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 uppercase"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Comprovante PIX</span>
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* PRODUCTS CATALOG EDITOR */}
              {!loading && activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-805 dark:text-zinc-200">
                      🍔 Curadoria de Cardápio Ativo
                    </h4>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setPName('');
                        setPPrice('');
                        setPDesc('');
                        setPImage('');
                        setShowProductForm(true);
                      }}
                      className="p-1.5 px-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold text-xs flex items-center gap-1 uppercase transition-colors"
                      id="admin-add-product-init"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Prato</span>
                    </button>
                  </div>

                  {/* Product Form modal overlay */}
                  {showProductForm && (
                    <form onSubmit={handleSaveProduct} className="bg-white dark:bg-zinc-900 border p-5 sm:p-6 rounded-2xl shadow-md space-y-4">
                      <div className="flex justify-between items-center border-b pb-1.5 mb-2 text-zinc-800 dark:text-zinc-150">
                        <span className="text-xs font-black uppercase tracking-wider">
                          {editingProduct ? 'Editar Hambúrguer' : 'Cadastrar Hambúrguer/Lanche'}
                        </span>
                        <button type="button" onClick={() => setShowProductForm(false)} className="text-zinc-410 hover:text-rose-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-zinc-600 block mb-1">Título do Prato *</label>
                          <input
                            type="text"
                            required
                            value={pName}
                            onChange={(e) => setPName(e.target.value)}
                            placeholder="Ex: X-Calabresa Monstro"
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-600 block mb-1">Preço Base (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={pPrice}
                            onChange={(e) => setPPrice(e.target.value)}
                            placeholder="Ex: 18.50"
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-650 block mb-1">Mídia Link (URL Imagem)</label>
                          <input
                            type="text"
                            value={pImage}
                            onChange={(e) => setPImage(e.target.value)}
                            placeholder="Ex: https://unsplash.com/..."
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-650 block mb-1">Categoria</label>
                          <select
                            value={pCategory}
                            onChange={(e) => setPCategory(e.target.value)}
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50 font-semibold text-zinc-700"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-zinc-650 block mb-1">Ingredientes & Descrição</label>
                          <textarea
                            value={pDesc}
                            onChange={(e) => setPDesc(e.target.value)}
                            placeholder="Ex: Pão brioche, duas smash carnes bovinas, cebola caramelizada, queijo prato temperadinho..."
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50 duration-200 min-h-[70px] resize-none"
                          />
                        </div>

                        <div className="flex items-center space-x-6 sm:col-span-2 pt-1 font-bold text-zinc-705">
                          <label className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={pAvailable}
                              onChange={(e) => setPAvailable(e.target.checked)}
                            />
                            <span>Disponível para Compra</span>
                          </label>

                          <label className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={pPopular}
                              onChange={(e) => setPPopular(e.target.checked)}
                            />
                            <span>Marcar como Mais Pedido (Estrela)</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase"
                        id="admin-add-product-save"
                      >
                        {editingProduct ? 'Salvar Alterações' : 'Adicionar ao Cardápio'}
                      </button>
                    </form>
                  )}

                  {/* Directory list of catalog */}
                  <div className="space-y-2.5">
                    {products.map((p) => (
                      <div key={p.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm text-xs">
                        <div className="flex items-center space-x-3 text-left">
                          <img src={p.image} referrerPolicy="no-referrer" className="w-[45px] h-[45px] rounded-lg object-cover bg-zinc-100" />
                          <div>
                            <h5 className="font-extrabold text-zinc-800 dark:text-zinc-100 text-xs sm:text-sm">{p.name}</h5>
                            <span className="text-[10px] text-zinc-400 font-bold block uppercase mt-0.5">
                              R$ {p.price.toFixed(2)} • {categories.find((c) => c.id === p.category)?.name || p.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1 px-3 bg-zinc-100 dark:bg-zinc-850 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 rounded-lg font-bold text-[10px] transition uppercase flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 px-3 bg-zinc-100 dark:bg-zinc-850 hover:bg-rose-50 text-zinc-600 hover:text-rose-650 rounded-lg font-bold text-[10px] transition uppercase flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* SETTINGS/CUSTOMIZATION TAB */}
              {!loading && activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                      <Settings className="w-4.5 h-4.5 text-rose-500 animate-spin-slow" />
                      <span>Customização do Estabelecimento</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Store info modification */}
                    <div className="bg-white dark:bg-zinc-900 border p-5 rounded-2xl shadow-sm text-xs space-y-4">
                      <h5 className="font-extrabold flex items-center gap-1 border-b pb-1 bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded-lg text-zinc-805 dark:text-zinc-100">
                        <Store className="w-4 h-4 text-rose-600" />
                        <span>Parâmetros de Lanchebem:</span>
                      </h5>

                      <div className="space-y-3.5 text-left">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-600 block mb-1">Taxa de Entrega de Coroatá (R$)</label>
                          <input
                            type="number"
                            step="0.10"
                            value={sFee}
                            onChange={(e) => setSFee(e.target.value)}
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-650 block mb-1">Chave de Pagamento PIX (Celular/Chave)</label>
                          <input
                            type="text"
                            value={sPixKey}
                            onChange={(e) => setSPixKey(e.target.value)}
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-650 block mb-1">Endereço Descritivo do Delivery</label>
                          <textarea
                            value={sAddress}
                            onChange={(e) => setSAddress(e.target.value)}
                            className="w-full text-xs sm:text-sm p-2.5 border rounded-xl focus:outline-rose-500 bg-zinc-50 font-medium min-h-[50px] resize-none"
                          />
                        </div>

                        <div className="pt-2 font-bold select-none text-zinc-705">
                          <label className="flex items-center space-x-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sOpen}
                              onChange={(e) => setSOpen(e.target.checked)}
                            />
                            <span>Estabelecimento Aberto (Receber Pedidos)</span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveSettings}
                        className="w-full p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase transition"
                      >
                        Salvar Informações
                      </button>
                    </div>

                    {/* Manage Coupons codes block */}
                    <div className="bg-white dark:bg-zinc-900 border p-5 rounded-2xl shadow-sm space-y-4 text-xs">
                      <h5 className="font-extrabold flex items-center gap-1 border-b pb-1 bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded-lg text-zinc-805 dark:text-zinc-100">
                        <Tag className="w-4 h-4 text-rose-600" />
                        <span>Cupons de Promoção:</span>
                      </h5>

                      <div className="space-y-3.5 text-left border p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/20">
                        <span className="text-[10px] font-black uppercase text-rose-501 block tracking-wider leading-none">Criar Novo Cupom</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-zinc-650 block">Código Cupom *</label>
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              placeholder="Ex: QUERO10"
                              className="w-full p-2 border rounded-xl bg-white uppercase font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-650 block">Desconto tipo</label>
                            <select
                              value={couponType}
                              onChange={(e) => setCouponType(e.target.value as any)}
                              className="w-full p-2 border rounded-xl bg-white font-bold"
                            >
                              <option value="fixed">Fixo (R$)</option>
                              <option value="percentage">Porcentagem (%)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-650 block">Valor desconto *</label>
                            <input
                              type="number"
                              value={couponVal}
                              onChange={(e) => setCouponVal(e.target.value)}
                              placeholder="10 ou 5.00"
                              className="w-full p-2 border rounded-xl bg-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-650 block col-span-2">Pedido Mínimo (R$)</label>
                            <input
                              type="number"
                              value={couponMin}
                              onChange={(e) => setCouponMin(e.target.value)}
                              placeholder="Opcional"
                              className="w-full p-2 border rounded-xl bg-white font-bold"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleAddCouponSettingOrder}
                          className="w-full p-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-50 dark:text-zinc-950 rounded-xl font-bold uppercase transition"
                        >
                          Emitir Cupom
                        </button>
                      </div>

                      {/* Display current active lists */}
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] text-zinc-400 font-extrabold uppercase block tracking-wider mb-1">Cupons Ativos:</span>
                        {settings.coupons?.map((co) => (
                          <div key={co.code} className="p-2.5 border rounded-xl flex items-center justify-between font-bold bg-white dark:bg-zinc-950 dark:border-zinc-850">
                            <div className="flex flex-col">
                              <span>{co.code}</span>
                              <span className="text-[9px] text-zinc-400 font-semibold leading-none mt-1">
                                Saldo: {co.discountType === 'percentage' ? `${co.value}%` : `R$ ${co.value.toFixed(2)}`}
                                {co.minOrderValue ? ` • Mín: R$ ${co.minOrderValue.toFixed(2)}` : ''}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveCoupon(co.code)}
                              className="p-1 text-zinc-400 hover:text-rose-650 transition-colors"
                              title="Remover cupom"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Cadastro de Entregadores (Motoboys) */}
                    <div className="bg-white dark:bg-zinc-900 border p-5 rounded-2xl shadow-sm space-y-4 text-xs">
                      <h5 className="font-extrabold flex items-center gap-1 border-b pb-1 bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded-lg text-zinc-805 dark:text-zinc-100">
                        <Bike className="w-4 h-4 text-rose-600" />
                        <span>Cadastro de Motoboys (Entregadores):</span>
                      </h5>

                      <div className="space-y-3 px-1">
                        <div className="space-y-2.5 text-left border p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/20">
                          <span className="text-[10px] font-black uppercase text-rose-600 block tracking-wider leading-none">Novo Entregador</span>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] font-bold text-zinc-650 block mb-0.5">Nome do Entregador *</label>
                              <input
                                type="text"
                                value={newRiderName}
                                onChange={(e) => setNewRiderName(e.target.value)}
                                placeholder="Ex: Raimundo Ventura"
                                className="w-full p-2 border border-zinc-250 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-zinc-650 block mb-0.5">Moto (Marca & Modelo) *</label>
                              <input
                                type="text"
                                value={newRiderModel}
                                onChange={(e) => setNewRiderModel(e.target.value)}
                                placeholder="Ex: Honda Pop 110i Vermelha"
                                className="w-full p-2 border border-zinc-250 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 font-bold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-zinc-650 block mb-0.5">Placa da Moto</label>
                                <input
                                  type="text"
                                  value={newRiderPlate}
                                  onChange={(e) => setNewRiderPlate(e.target.value)}
                                  placeholder="MA-1020 (Opcional)"
                                  className="w-full p-2 border border-zinc-250 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 font-bold uppercase"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-zinc-650 block mb-0.5">Telefone / Whats</label>
                                <input
                                  type="text"
                                  value={newRiderPhone}
                                  onChange={(e) => setNewRiderPhone(e.target.value)}
                                  placeholder="(99) 98144-4848"
                                  className="w-full p-2 border border-zinc-250 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleAddRiderSetting}
                            className="w-full p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold uppercase transition text-xs shrink-0 cursor-pointer shadow-sm"
                          >
                            Cadastrar Motoboy
                          </button>
                        </div>
                      </div>

                      {/* Display current active lists */}
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] text-zinc-400 font-extrabold uppercase block tracking-wider mb-1">Motoboys Cadastrados:</span>
                        {(!settings.riders || settings.riders.length === 0) ? (
                          <p className="text-[10px] text-zinc-400 italic">Nenhum motoboy cadastrado.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {settings.riders.map((r) => (
                              <div key={r.id} className="p-2 border rounded-xl flex items-center justify-between font-bold bg-white dark:bg-zinc-950 dark:border-zinc-850">
                                <div className="flex flex-col text-left">
                                  <span className="text-zinc-800 dark:text-zinc-100">{r.name}</span>
                                  <span className="text-[9px] text-zinc-400 font-semibold leading-relaxed mt-0.5">
                                    Moto: {r.vehicleModel} {r.plate ? ` • Placa: ${r.plate}` : ''}
                                    {r.phone ? ` • Whats: ${r.phone}` : ''}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveRider(r.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-650 transition-colors cursor-pointer"
                                  title="Remover entregador"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* DELIVERIES / RIDER TAB */}
              {!loading && activeTab === 'deliveries' && (
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
                  <RiderPanel isInline={true} />
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Expand image lightbox overlay for proof analysis */}
      {selectedOrderReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 flex flex-col items-center">
            
            <button
              onClick={() => setSelectedOrderReceipt(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-sm font-black text-white self-start border-b border-zinc-800 pb-2 mb-4 w-full text-left">
              Análise de Comprovante: Pedido {selectedOrderReceipt.id}
            </h4>

            {selectedOrderReceipt.receiptBase64?.startsWith('data:application/pdf') ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-10 text-rose-500">
                <FileText className="w-16 h-16" />
                <span className="text-rose-300 font-bold uppercase text-xs">Arquivo PDF Anexado</span>
                <span className="text-[11px] text-zinc-500">{selectedOrderReceipt.receiptFileName}</span>
              </div>
            ) : (
              <div className="w-full max-h-[60vh] overflow-hidden rounded-xl border border-zinc-800 bg-black flex items-center justify-center">
                <img
                  src={selectedOrderReceipt.receiptBase64}
                  alt="Screenshot do Comprovante PIX"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
            )}

            <div className="w-full flex gap-3 mt-5 pt-3.5 border-t border-zinc-800 shrink-0">
              <button
                onClick={() => handleUpdateOrderStatus(selectedOrderReceipt.id, selectedOrderReceipt.status, true)}
                className="flex-1 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1"
                id="lightbox-pix-accept"
              >
                <Check className="w-4 h-4" />
                <span>Validar Pagamento</span>
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(selectedOrderReceipt.id, 'Cancelado')}
                className="p-3 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl font-bold text-xs uppercase"
              >
                Rejeitar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
