import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bike, CheckCircle2, Clock, MapPin, X, MessageSquare, ShoppingBag, Navigation, RefreshCw, Wifi } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderTrackerProps {
  orderId: string | null;
  onClose: () => void;
}

export default function OrderTracker({ orderId, onClose }: OrderTrackerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Gps and Simulation States
  const [activeTab, setActiveTab] = useState<'status' | 'gps'>('status');
  const [trackingMode, setTrackingMode] = useState<'live' | 'simulation'>('live');
  const [localSimPercent, setLocalSimPercent] = useState(0);
  const [localSimulating, setLocalSimulating] = useState(false);

  const fetchOrderStatus = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/public/order/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      setError('Não foi possível localizar o seu pedido no servidor.');
    }
  };

  // Poll status every 6 seconds for highly responsive updates
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetchOrderStatus().finally(() => setLoading(false));

    const poll = setInterval(() => {
      fetchOrderStatus();
    }, 6000);

    return () => clearInterval(poll);
  }, [orderId]);

  // Auto-switch to GPS Tab if the order status is 'Saiu para entrega'
  useEffect(() => {
    if (order?.status === 'Saiu para entrega') {
      setActiveTab('gps');
      setTrackingMode('live'); // Always lock on live-GPS when rider is active
    }
  }, [order?.status]);

  // Handle Local Simulation Loop interval timer
  useEffect(() => {
    if (!localSimulating) return;
    const interval = setInterval(() => {
      setLocalSimPercent((prev) => {
        if (prev >= 100) {
          return 0; // restarts simulation automatically
        }
        return prev + 2;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [localSimulating]);

  if (!orderId) return null;

  const stepsList: { status: OrderStatus; label: string; desc: string; icon: string }[] = [
    { status: 'Recebido', label: 'Pedido Recebido', desc: 'Sua solicitação chegou ao Chef Lanchebem.', icon: '📥' },
    { status: 'Em preparo', label: 'Na Cozinha', desc: 'Seu lanche está sendo preparado com muito carinho.', icon: '🍳' },
    { status: 'Saiu para entrega', label: 'Saiu para Entrega', desc: 'O entregador já coletou e está a caminho.', icon: '🛵' },
    { status: 'Entregue', label: 'Pedido Entregue', desc: 'Bom apetite! Deixe sua avaliação depois.', icon: '😋' }
  ];

  const getStatusIndex = (s: OrderStatus) => {
    if (s === 'Cancelado') return -1;
    const idx = stepsList.findIndex((step) => step.status === s);
    return idx !== -1 ? idx : 0;
  };

  const statusIdx = order ? getStatusIndex(order.status) : 0;

  // Math interpolation for route coordinate calculation
  // Base SVG Route: Starting at x=60,y=30 -> x=150,y=30 -> x=150,y=90 -> x=320,y=90
  // Segment A: length = 90
  // Segment B: length = 60
  // Segment C: length = 170
  // Total Length = 320
  const getCoordinatesForPercent = (percent: number) => {
    const p = Math.max(0, Math.min(100, percent));
    const len1 = 90;
    const len2 = 60;
    const len3 = 170;
    const totalLen = len1 + len2 + len3; // 320
    const targetDist = (p / 100) * totalLen;

    if (targetDist <= len1) {
      // Segment 1 (y remains 30, x goes from 60 to 150)
      return { x: 60 + targetDist, y: 30 };
    } else if (targetDist <= len1 + len2) {
      // Segment 2 (x remains 150, y goes from 30 to 90)
      const d = targetDist - len1;
      return { x: 150, y: 30 + d };
    } else {
      // Segment 3 (y remains 90, x goes from 150 to 320)
      const d = targetDist - (len1 + len2);
      return { x: 150 + d, y: 90 };
    }
  };

  // Determine current active progress percentage
  // If we are simulating locally, use localSimPercent, otherwise read backend order progress
  const currentProgress = (trackingMode === 'simulation' || localSimulating)
    ? localSimPercent
    : (order?.deliveryProgress !== undefined ? order.deliveryProgress : 0);

  const isBikerMoving = order?.status === 'Saiu para entrega' || localSimulating;

  const runningProgressPercent = order?.status === 'Entregue' ? 100 : currentProgress;

  // Position coordinates map mapping
  const riderCoords = getCoordinatesForPercent(runningProgressPercent);

  // Real-time neighborhood route description helper
  const getRouteDescription = (prog: number) => {
    if (order?.status === 'Entregue') return "✓ Pedido entregue com sucesso! Bom apetite! Lanchebem preza pelo seu carinho.";
    if (order?.status !== 'Saiu para entrega' && trackingMode !== 'simulation' && !localSimulating) {
      return "Aguardando o entregador iniciar a rota logística pela cidade...";
    }
    if (prog === 0) return "Sincronizando coordenadas - Entregador saindo da Segunda Travessa São Rafael...";
    if (prog < 25) return "Motoboy saiu do Bairro Mariol e está cruzando a rotatória sentido Centro!";
    if (prog < 50) return "Acelerando pela Avenida Central de Coroatá, passando por trás da Igreja Matriz...";
    if (prog < 75) return "Entregador cruzando com cautela o Trilho de Trem da Linha de Ferro...";
    if (prog < 95) return "Seu lanche está pertinho! Entrando na sua rua - prepare-se para recebê-lo!";
    return "Chegou! O motoboy da Lanchebem já encostou e está buzinando na frente da sua casa! 🛵";
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" 
      id="order-tracker-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Draw Header bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between text-zinc-950 dark:text-zinc-50 bg-rose-600 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-700/80 flex items-center justify-center">
              <Bike className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-sm sm:text-base">Painel de Acompanhamento</h3>
              <p className="text-[10px] text-rose-100 font-bold">{orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-rose-700 text-rose-100 hover:text-white transition"
            id="tracker-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left custom-scrollbar">
          
          {loading && !order && (
            <div className="h-[40vh] flex flex-col items-center justify-center space-y-2 text-zinc-400">
              <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              <p className="text-xs font-semibold">Consultando status do pedido...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/10 rounded-2xl text-rose-600 text-xs sm:text-sm text-center">
              {error}
            </div>
          )}

          {order && (
            <>
              {/* Order quick overview banner */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-black block tracking-widest">Previsão Entrega</span>
                  <div className="text-base sm:text-lg font-black text-rose-600 flex items-center gap-1.5">
                    <Clock className="w-4.5 h-4.5" />
                    <span>{order.status === 'Entregue' ? 'Entregue!' : '30-50 min'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-black block tracking-widest">Total com Taxa</span>
                  <div className="text-base sm:text-lg font-black text-zinc-800 dark:text-zinc-100">
                    R$ {order.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tabs Switcher Selector - Professional Control */}
              {order.status !== 'Cancelado' && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950/80 rounded-2xl border border-zinc-205 dark:border-zinc-850" id="tracker-tabs">
                  <button
                    onClick={() => setActiveTab('status')}
                    className={`py-2 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeTab === 'status'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <span>Timeline Pedido</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('gps')}
                    className={`py-2 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 relative ${
                      activeTab === 'gps'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Trajeto em Tempo Real</span>
                    {order.status === 'Saiu para entrega' && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>
              )}

              {/* Cancelled guard banner */}
              {order.status === 'Cancelado' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-rose-600 font-bold rounded-2xl text-xs sm:text-sm text-center animate-shake">
                  ⚠️ Este pedido foi cancelado pelo estabelecimento. Entre em contato para mais detalhes.
                </div>
              )}

              {order.status !== 'Cancelado' && activeTab === 'status' && (
                /* Progress Timeline Tracker tab */
                <div className="relative pl-6.5 py-2 space-y-5 animate-fade-in">
                  <div className="absolute left-[13px] top-4.5 bottom-4.5 w-0.5 border-l-2 border-dashed border-zinc-250 dark:border-zinc-800" />
                  
                  {stepsList.map((step, idx) => {
                    const isPassed = idx <= statusIdx;
                    const isActive = idx === statusIdx;

                    return (
                      <div key={idx} className="relative flex items-start gap-4">
                        <div className={`absolute -left-[30px] z-10 w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                          isPassed 
                            ? 'bg-rose-600 border-2 border-rose-600 shadow shadow-rose-500/20 text-[10px] font-black text-white' 
                            : 'bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700'
                        }`}>
                          {isPassed && '✓'}
                        </div>

                        <span className="text-xl shrink-0 p-1 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                          {step.icon}
                        </span>

                        <div className="space-y-0.5">
                          <h4 className={`text-xs sm:text-sm font-extrabold ${
                            isActive 
                              ? 'text-rose-600' 
                              : isPassed 
                                ? 'text-zinc-800 dark:text-zinc-250' 
                                : 'text-zinc-400 dark:text-zinc-500'
                          }`}>
                            {step.label}
                          </h4>
                          <p className={`text-[11px] leading-relaxed ${
                            isPassed ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400/80 dark:text-zinc-600'
                          }`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* REAL-TIME RADAR GPS MAP TAB */}
              {order.status !== 'Cancelado' && activeTab === 'gps' && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  
                  {/* Satelite details / signal strength overlay */}
                  <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest pb-1 border-b border-zinc-150 dark:border-zinc-800">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Saiu para entrega' ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
                      <span>{order.status === 'Saiu para entrega' ? 'GPS ao Vivo Conectado' : 'Simulador da Rota'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-rose-550">
                      <Wifi className="w-3 h-3 text-rose-500" />
                      <span>{order.status === 'Saiu para entrega' ? 'Transmissão 3G' : 'Local Host'}</span>
                    </span>
                  </div>

                  {/* The Interactive GPS SVG Vector Map of Coroatá, MA */}
                  <div className="relative w-full h-[180px] bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-inner font-sans">
                    
                    {/* SVG Map Layout */}
                    <svg viewBox="0 0 400 150" className="w-full h-full text-zinc-300 dark:text-zinc-800">
                      <defs>
                        <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" opacity="0.4" />
                        </pattern>
                      </defs>
                      
                      {/* Grid background representing block divisions */}
                      <rect width="100%" height="100%" fill="url(#city-grid)" />
                      
                      {/* Stylized River (Rio Itapecuru) that flows through Coroatá MA */}
                      <path d="M -10,130 C 130,140 180,10 410,20" fill="none" stroke="#3b82f6" strokeWidth="15" strokeLinecap="round" opacity="0.12" />
                      <text x="350" y="24" fill="#3b82f6" fontSize="6" fontWeight="bold" opacity="0.3" transform="rotate(2)" className="italic tracking-widest">RIO ITAPECURU</text>

                      {/* City blocks representation */}
                      <rect x="180" y="45" width="45" height="30" rx="3" fill="currentColor" opacity="0.08" />
                      <rect x="250" y="10" width="80" height="30" rx="3" fill="currentColor" opacity="0.08" />
                      <rect x="10" y="45" width="100" height="35" rx="3" fill="currentColor" opacity="0.08" />

                      {/* Major Streets Texts */}
                      <text x="110" y="24" fill="currentColor" fontSize="6" fontWeight="black" opacity="0.5">AV. CENTRAL (CENTRO)</text>
                      <text x="50" y="115" fill="currentColor" fontSize="6" fontWeight="black" opacity="0.5">ESTRADA DO MARIOL</text>
                      <text x="210" y="115" fill="currentColor" fontSize="6" fontWeight="black" opacity="0.5">LINHA FÉRREA DE COROATÁ 🚂</text>

                      {/* Railroad track graphic */}
                      <line x1="0" y1="120" x2="400" y2="120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3" opacity="0.25" />

                      {/* Route Path Line (glowing background loop) */}
                      <path d="M 60,30 L 150,30 L 150,90 L 320,90" fill="none" stroke="#e11d48" strokeWidth="3.5" strokeLinecap="round" className="opacity-15" />
                      
                      {/* Driven Path highlighting (solid red trace of progress!) */}
                      <path 
                        d="M 60,30 L 150,30 L 150,90 L 320,90" 
                        fill="none" 
                        stroke="#e11d48" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeDasharray="4"
                        className="opacity-90 animate-dash-offset" 
                      />

                      {/* Origin Landmark: Lanchebem Store (Bairro Mariol) */}
                      <g transform="translate(60, 30)">
                        <circle r="12" fill="#e11d48" opacity="0.2" />
                        <circle r="4" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                        <text x="0" y="18" fill="#e11d48" fontSize="7" fontWeight="black" textAnchor="middle" className="dark:fill-rose-400">LANCHEBEM (MARIOL)</text>
                      </g>

                      {/* Customer Destination landmark */}
                      <g transform="translate(320, 90)">
                        <circle r="12" fill="#10b981" opacity="0.2" className="animate-pulse" />
                        <polygon points="0,-4 4,4 -4,4" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                        <text x="0" y="18" fill="#10b981" fontSize="7" fontWeight="black" textAnchor="middle" className="dark:fill-green-400">SEU ENDEREÇO</text>
                      </g>

                      {/* REAL-TIME VEHICLE POSITION CURSOR ELEMENT */}
                      <g transform={`translate(${riderCoords.x}, ${riderCoords.y})`}>
                        {/* Glow halo pointer */}
                        <circle r="16" fill="#e11d48" opacity="0.15" className="animate-ping" key={runningProgressPercent} />
                        <circle r="7.5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" className="shadow-md" />
                        <text y="-10" fontSize="11" textAnchor="middle" className="filter drop-shadow-sm select-none">🛵</text>
                        {/* Little text progress on cursor */}
                        <text y="4.5" fontSize="5" fontWeight="extrabold" fill="#ffffff" textAnchor="middle">
                          {runningProgressPercent}%
                        </text>
                      </g>
                    </svg>

                    {/* Bottom Floating Status Banner of Map */}
                    <div className="absolute bottom-2.5 left-3 right-3 bg-zinc-950/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-[9.5px] text-zinc-100 font-bold flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isBikerMoving ? 'bg-green-500 animate-ping' : 'bg-orange-500'}`} />
                        <span className="truncate">
                          {order.status === 'Saiu para entrega' 
                            ? 'Sinal de GPS do entregador ativo' 
                            : (localSimulating ? `Executando simulação de trajeto: ${runningProgressPercent}%` : 'Dispostivo do entregador aguardando início...')}
                        </span>
                      </span>
                      <span className="text-zinc-400 font-mono text-[9px]">{runningProgressPercent}%</span>
                    </div>
                  </div>

                  {/* Professional Telemetry Details Grid Card */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 space-y-3 shadow-inner text-left">
                    
                    {/* Active rider profile block metadata status */}
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-base shrink-0 select-none">
                          👨‍✈️
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate">
                            {order.riderName || "Raimundo Ventura"}
                          </h5>
                          <p className="text-[9.5px] text-zinc-405 font-bold uppercase tracking-wide truncate">
                            {order.riderVehicle || "Pop 110i Vermelha"}
                          </p>
                        </div>
                      </div>

                      {order.riderPhone && (
                        <a
                          href={`tel:${order.riderPhone}`}
                          className="py-1.5 px-3 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-350 rounded-xl font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          Ligar
                        </a>
                      )}
                    </div>

                    {/* Numeric Real-time logistics values (responsive grid) */}
                    <div className="grid grid-cols-3 gap-2.5 text-left">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850/50">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Distância</span>
                        <p className="text-xs sm:text-sm font-extrabold text-rose-600 mt-0.5">
                          {order.status === 'Entregue' ? 'Chegou!' : `${Math.max(0, 2.4 * (1 - runningProgressPercent / 100)).toFixed(2)} km`}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850/50">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Velocidade</span>
                        <p className="text-xs sm:text-sm font-extrabold text-zinc-700 dark:text-zinc-200 mt-0.5">
                          {order.status === 'Entregue' ? '0 km/h' : (isBikerMoving ? '45 km/h' : 'Estático')}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850/50">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Previsão</span>
                        <p className="text-xs sm:text-sm font-extrabold text-zinc-800 dark:text-zinc-100 mt-0.5">
                          {order.status === 'Entregue' ? 'Entregue!' : `~ ${Math.max(1, Math.ceil(15 * (1 - runningProgressPercent / 100)))} min`}
                        </p>
                      </div>
                    </div>

                    {/* Chat log status annotation */}
                    <div className="text-center font-bold text-[10.5px] text-rose-600 dark:text-rose-400 italic bg-rose-50/50 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-100/40 dark:border-rose-900/10">
                      💬 {getRouteDescription(runningProgressPercent)}
                    </div>
                  </div>

                  {/* Local Testing fallback simulator trigger block */}
                  {order.status !== 'Saiu para entrega' && order.status !== 'Entregue' && (
                    <div className="p-4 bg-amber-500/10 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/10 rounded-2xl text-center space-y-2">
                      <p className="text-[10px] text-amber-705 dark:text-amber-350 font-extrabold">
                        👨‍🔧 TESTE DE SIMULAÇÃO DE GPS DO ENTREGADOR
                      </p>
                      <p className="text-[9px] text-zinc-500 leading-relaxed text-left">
                        O status atual do seu pedido é <strong>{order.status}</strong>. O entregador de Coroatá só liga o sinal do GPS após a preparação na cozinha. No entanto, você pode testar a experiência visual ao vivo clicando no botão abaixo para rodar o simulador local!
                      </p>
                      <div className="flex gap-2 justify-center pt-1">
                        <button
                          onClick={() => {
                            setLocalSimulating(!localSimulating);
                            setTrackingMode('simulation');
                          }}
                          className={`p-2 px-3.5 rounded-xl font-bold text-[11px] transition shadow-xs ${
                            localSimulating
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {localSimulating ? '⏸ Pausar Simulador' : '▶ Ativar Simulador de Rota'}
                        </button>
                        {localSimPercent > 0 && (
                          <button
                            onClick={() => {
                              setLocalSimPercent(0);
                              setLocalSimulating(false);
                              setTrackingMode('live');
                            }}
                            className="p-2 px-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-[11px]"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order items review card - Visible on both tabs for easy checklist */}
              <div className="space-y-2 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-805">
                <h4 className="text-xs font-bold text-zinc-650 dark:text-zinc-350 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                  Resumo do Pedido:
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-1.5">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-zinc-750 dark:text-zinc-300">
                      <span className="font-semibold">{item.quantity}x {item.productName}</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-150">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100">
                    <span>Taxa de Entrega</span>
                    <span>R$ {order.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-zinc-200 dark:border-zinc-850 text-rose-600">
                    <span>Total Pago</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* WhatsApp and Close support buttons footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row gap-3 shrink-0 justify-center">
          <a
            href={`https://api.whatsapp.com/send?phone=5599984545370&text=Ol%C3%A1%20Lanchebem!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20meu%20pedido%20${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 text-xs sm:text-sm transition-transform active:scale-99"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span>Chamar no WhatsApp</span>
          </a>
          <button
            onClick={onClose}
            className="p-3.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-2xl font-bold text-xs sm:text-sm transition-transform active:scale-99"
            id="tracker-footer-close"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
}
