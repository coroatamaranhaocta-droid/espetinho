import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, MapPin, Tag, Truck, CreditCard, ChevronRight } from 'lucide-react';
import { CartItem, StoreSettings, Coupon } from '../types';
import PixPayment from './PixPayment';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemoveItem: (index: number) => void;
  settings: StoreSettings;
  onClearCart: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  settings,
  onClearCart,
  onOrderSuccess
}: CartProps) {
  if (!isOpen) return null;

  // Checkout phases
  const [step, setStep] = useState<'cart' | 'details' | 'payment'>('cart');
  const [formError, setFormError] = useState('');

  // Helper function to format Brazilian phone/WhatsApp dynamically
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);
    if (limited.length <= 2) {
      return limited;
    }
    if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    }
    if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    }
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };
  
  // Delivery address / User State
  const [customerName, setCustomerName] = useState(() => {
    try {
      const saved = localStorage.getItem('lanchebem_customer_name');
      if (saved) return saved;
      const savedUser = localStorage.getItem('lanchebem_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.name || '';
      }
    } catch (e) {}
    return '';
  });
  
  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      const saved = localStorage.getItem('lanchebem_customer_phone');
      return saved ? formatPhone(saved) : '';
    } catch (e) {
      return '';
    }
  });

  const [street, setStreet] = useState(() => {
    try {
      return localStorage.getItem('lanchebem_customer_street') || '';
    } catch (e) {
      return '';
    }
  });

  const [number, setNumber] = useState(() => {
    try {
      return localStorage.getItem('lanchebem_customer_number') || '';
    } catch (e) {
      return '';
    }
  });

  const [neighborhood, setNeighborhood] = useState(() => {
    try {
      return localStorage.getItem('lanchebem_customer_neighborhood') || 'Mariol';
    } catch (e) {
      return 'Mariol';
    }
  });

  const [complement, setComplement] = useState(() => {
    try {
      return localStorage.getItem('lanchebem_customer_complement') || '';
    } catch (e) {
      return '';
    }
  });

  const [reference, setReference] = useState(() => {
    try {
      return localStorage.getItem('lanchebem_customer_reference') || '';
    } catch (e) {
      return '';
    }
  });

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro'>('PIX');
  const [changeFor, setChangeFor] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Totals dynamic calculators
  const subtotal = cartItems.reduce((sum, item) => {
    const sizeAdjust = item.selectedSize ? item.selectedSize.priceAdjustment : 0;
    const optsAddition = item.selectedOptions.reduce((oSum, o) => oSum + o.price, 0);
    return sum + (item.product.price + sizeAdjust + optsAddition) * item.quantity;
  }, 0);

  // Apply discount logic
  let discount = 0;
  if (appliedCoupon) {
    if (!appliedCoupon.minOrderValue || subtotal >= appliedCoupon.minOrderValue) {
      if (appliedCoupon.discountType === 'fixed') {
        discount = appliedCoupon.value;
      } else {
        discount = (subtotal * appliedCoupon.value) / 100;
      }
    }
  }

  const deliveryFee = settings.deliveryFee || 5.00;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Coupon Apply evaluation
  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    // Check settings coupons
    const codeUpper = couponCode.trim().toUpperCase();
    const found = settings.coupons?.find((c) => c.code.toUpperCase() === codeUpper);

    if (!found) {
      setCouponError('Cupom inválido ou expirado.');
      setAppliedCoupon(null);
    } else if (found.minOrderValue && subtotal < found.minOrderValue) {
      setCouponError(`Minimo de R$ ${found.minOrderValue.toFixed(2)} para este cupom.`);
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(found);
    }
  };

  const handleApplyStepDetails = () => {
    if (!customerName.trim() || !customerPhone.trim() || !street.trim() || !number.trim() || !neighborhood.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios identificados (*).');
      return;
    }

    setFormError('');

    // Save fields to localStorage for returning customers
    try {
      localStorage.setItem('lanchebem_customer_name', customerName.trim());
      localStorage.setItem('lanchebem_customer_phone', customerPhone.trim());
      localStorage.setItem('lanchebem_customer_street', street.trim());
      localStorage.setItem('lanchebem_customer_number', number.trim());
      localStorage.setItem('lanchebem_customer_neighborhood', neighborhood.trim());
      localStorage.setItem('lanchebem_customer_complement', complement.trim());
      localStorage.setItem('lanchebem_customer_reference', reference.trim());
    } catch (e) {
      console.warn('Could not save customer details to localStorage:', e);
    }

    setStep('payment');
  };

  const handleCheckoutComplete = async () => {
    setSubmitting(true);
    try {
      const orderPayload = {
        customerName,
        customerPhone,
        deliveryAddress: {
          street,
          number,
          neighborhood,
          complement,
          reference
        },
        items: cartItems.map((item) => {
          const sizeAdjust = item.selectedSize ? item.selectedSize.priceAdjustment : 0;
          const optsAdditional = item.selectedOptions.reduce((s, o) => s + o.price, 0);
          return {
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price + sizeAdjust + optsAdditional,
            selectedSize: item.selectedSize?.name,
            selectedOptions: item.selectedOptions.map((o) => o.name),
            observation: item.observation
          };
        }),
        paymentMethod,
        paymentDetails: paymentMethod === 'Dinheiro' && changeFor ? { changeFor: Number(changeFor) } : undefined,
        subtotal,
        deliveryFee,
        total
      };

      // Submit Order payload to backend
      const res = await fetch('/api/public/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const { order, success } = await res.json();

      if (!success || !order) {
        throw new Error('Falha de resposta do servidor.');
      }

      // If PIX, upload receipt attached
      if (paymentMethod === 'PIX' && receiptBase64) {
        await fetch(`/api/public/order/${order.id}/receipt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiptBase64,
            filename: receiptFileName
          })
        });
      }

      // Compose Structured WhatsApp message blocks
      const itemsList = cartItems
        .map((item) => {
          const sizeStr = item.selectedSize ? ` - Tam: ${item.selectedSize.name}` : '';
          const optsStr = item.selectedOptions.length
            ? `\n  + Adicionais: ${item.selectedOptions.map((o) => o.name).join(', ')}`
            : '';
          const obsStr = item.observation ? `\n  _Obs: ${item.observation}_` : '';
          return `• ${item.quantity}x ${item.product.name}${sizeStr}${optsStr}${obsStr}`;
        })
        .join('\n');

      const addressDetails = `${street}, N° ${number}
Bairro: ${neighborhood}${complement ? `\nCompl: ${complement}` : ''}${reference ? `\nRef: ${reference}` : ''}`;

      const waMessage = `*🍔 NOVO PEDIDO - LANCHEBEM (${order.id})*
----------------------------------
*Cliente:* ${customerName}
*Telefone:* ${customerPhone}
----------------------------------
*Produtos:*
${itemsList}

*Subtotal:* R$ ${subtotal.toFixed(2)}
*Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}
${discount > 0 ? `*Desconto:* R$ ${discount.toFixed(2)} (Cupom: ${appliedCoupon?.code})\n` : ''}*TOTAL:* R$ ${total.toFixed(2)}
----------------------------------
*Forma de Pagamento:* ${paymentMethod}
${paymentMethod === 'Dinheiro' && changeFor ? `*Troco para:* R$ ${Number(changeFor).toFixed(2)}\n` : ''}${paymentMethod === 'PIX' ? `*(Comprovante enviado pelo site!)*\n` : ''}----------------------------------
*Endereço de Entrega:*
${addressDetails}

_Acompanhe seu pedido no app Lanchebem!_`;

      const encodedMsg = encodeURIComponent(waMessage);
      const whatsappURL = `https://api.whatsapp.com/send?phone=5599984545370&text=${encodedMsg}`;

      // Open WhatsApp Link safely within try-catch to avoid blocking popup/sandbox errors
      try {
        const opened = window.open(whatsappURL, '_blank');
        if (!opened) {
          // If window.open returned null, attempt direct link click fallback
          const link = document.createElement('a');
          link.href = whatsappURL;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (waErr) {
        console.warn('WhatsApp popup was blocked or failed to open', waErr);
        // Do not block order progress, just log and fall back to opening in current tab if possible
        try {
          const link = document.createElement('a');
          link.href = whatsappURL;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (innerErr) {
          console.warn('Secondary redirection link also failed', innerErr);
        }
      }

      // Setup tracker and trigger success callbacks
      onOrderSuccess(order.id);
      onClearCart();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao enviar seu pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in" id="cart-drawer-container">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl relative">
        
        {/* Draw Header bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between text-zinc-950 dark:text-zinc-50">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Seu Carrinho</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition"
            id="cart-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Cart state block */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-left custom-scrollbar">
          
          {step === 'cart' && (
            <div className="space-y-5">
              {cartItems.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-2 text-zinc-400">
                  <span className="text-4xl">🛒</span>
                  <p className="text-sm font-semibold">Seu carrinho está vazio.</p>
                  <p className="text-xs max-w-[200px]">Adicione as delícias do nosso cardápio para começar.</p>
                </div>
              ) : (
                <>
                  {/* Items List layout */}
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => {
                      const itemPrice = item.product.price + 
                        (item.selectedSize ? item.selectedSize.priceAdjustment : 0) +
                        item.selectedOptions.reduce((s, o) => s + o.price, 0);

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-950/20 p-3.5 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl relative"
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div className="flex-1 text-left min-w-0">
                            <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                              {item.product.name}
                            </h4>
                            {item.selectedSize && (
                              <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block uppercase">
                                Tam: {item.selectedSize.name}
                              </span>
                            )}
                            {item.selectedOptions.length > 0 && (
                              <p className="text-[10px] text-zinc-405 mt-1 truncate">
                                + {item.selectedOptions.map((o) => o.name).join(', ')}
                              </p>
                            )}
                            {item.observation && (
                              <p className="text-[10px] text-zinc-450 dark:text-zinc-400 italic mt-0.5 truncate">
                                "{item.observation}"
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">
                                R$ {(itemPrice * item.quantity).toFixed(2)}
                              </span>
                              
                              {/* Quantity selectors */}
                              <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 px-1.5 rounded-xl">
                                <button
                                  onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                                  className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold w-4 text-center text-zinc-805 dark:text-zinc-200">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                                  className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveItem(idx)}
                            className="absolute top-2 right-2 text-zinc-400 hover:text-rose-650 p-1"
                            title="Remover produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cupons layout blocks */}
                  <div className="space-y-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-4">
                    <label className="text-xs font-bold text-zinc-650 dark:text-zinc-350 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-rose-500" />
                      Cupom de Desconto:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Ex: BEMVINDO, LANCHE10"
                        className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2 px-3 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-rose-500 uppercase font-semibold text-zinc-800 dark:text-zinc-200"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="p-2 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-950 rounded-xl text-xs font-semibold"
                        id="apply-coupon-btn"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-rose-600 font-bold">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-[10px] text-green-600 font-extrabold bg-green-50 dark:bg-green-950/40 border border-green-500/10 px-2 py-1 rounded-md w-fit">
                        ✓ Cupom {appliedCoupon.code} aplicado (- {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.value}%` : `R$ ${appliedCoupon.value.toFixed(2)}`})
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 border-b pb-2 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="tracking-tight">Dados de Identificação & Endereço</span>
              </h3>

              {formError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-rose-600 text-xs font-semibold animate-shake">
                  <span className="text-sm mt-0.5">⚠️</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-rose-700 dark:text-rose-400">Campos Obrigatórios</p>
                    <p className="opacity-90 leading-relaxed">{formError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Ex: André Souza"
                    className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-medium placeholder-zinc-400 dark:placeholder-zinc-600 transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                    Celular / WhatsApp (DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(formatPhone(e.target.value));
                      if (formError) setFormError('');
                    }}
                    placeholder="Ex: (99) 98811-2233"
                    className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-bold placeholder-zinc-400 dark:placeholder-zinc-600 transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                      Rua / Travessa *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => {
                        setStreet(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="Ex: Avenida Central"
                      className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-medium placeholder-zinc-400 dark:placeholder-zinc-600 transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => {
                        setNumber(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="Ex: 45A"
                      className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-bold placeholder-zinc-400 dark:placeholder-zinc-600 transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                    Selecione o Bairro *
                  </label>
                  <select
                    value={neighborhood}
                    onChange={(e) => {
                      setNeighborhood(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-bold transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm cursor-pointer"
                  >
                    <option value="Mariol">Bairro Mariol</option>
                    <option value="Centro">Centro</option>
                    <option value="Trizidela">Bairro Trizidela</option>
                    <option value="Vila de Cava">Vila de Cava</option>
                    <option value="Areal">Areal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                    Complemento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Ap 302, Bloco C"
                    className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-medium placeholder-zinc-400 dark:placeholder-zinc-600 transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5 tracking-wider">
                    Ponto de Referência (Opcional)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: Próximo à Igreja Matriz"
                    className="w-full text-xs sm:text-sm p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-zinc-800 dark:text-zinc-100 font-medium placeholder-zinc-400 dark:placeholder-zinc-600 transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-150 border-b pb-1.5 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-rose-600" />
                <span>Escolha a Forma de Pagamento:</span>
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => setPaymentMethod('PIX')}
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-extrabold border flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                    paymentMethod === 'PIX'
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-500 shadow-md shadow-rose-500/5'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-350'
                  }`}
                  id="pay-pix-tab"
                >
                  <span className="text-xl">⚡</span>
                  <span>PIX Instantâneo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Dinheiro')}
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-extrabold border flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                    paymentMethod === 'Dinheiro'
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-500 shadow-md shadow-rose-500/5'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-350'
                  }`}
                  id="pay-cash-tab"
                >
                  <span className="text-xl">💵</span>
                  <span>Dinheiro</span>
                </button>
              </div>

              {paymentMethod === 'PIX' ? (
                <PixPayment
                  total={total}
                  settings={settings}
                  onReceiptUploaded={(base64, filename) => {
                    setReceiptBase64(base64);
                    setReceiptFileName(filename);
                  }}
                  onCheckoutComplete={handleCheckoutComplete}
                />
              ) : (
                <div className="space-y-3.5 bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block">Precisa de Troco?</label>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-zinc-405 font-bold text-xs sm:text-sm">R$</span>
                    <input
                      type="number"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Ex: 50 ou 100"
                      className="flex-1 text-xs sm:text-sm p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-rose-500 duration-200 text-zinc-800 dark:text-zinc-200 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-405 mt-1">Deixe em branco se tiver o valor exato em mãos.</p>
                  
                  <button
                    onClick={handleCheckoutComplete}
                    disabled={submitting}
                    className="w-full mt-4 p-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-1 shadow-lg shadow-green-500/15"
                    id="dinheiro-finish-btn"
                  >
                    {submitting ? 'Enviando...' : 'Pedir via WhatsApp'}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Dynamic footer price block */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 select-none text-left transition-colors">
          <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Entrega:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {cartItems.length > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'R$ 0,00'}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-md">
                <span>Desconto Aplicado:</span>
                <span>- R$ {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span>Total:</span>
              <span>R$ {cartItems.length > 0 ? total.toFixed(2) : 'R$ 0,00'}</span>
            </div>
          </div>

          {/* Action step modifiers */}
          <div className="mt-4">
            {step === 'cart' && cartItems.length > 0 && (
              <button
                onClick={() => setStep('details')}
                className="w-full p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center justify-center space-x-1 select-none active:scale-99 transition-all text-xs sm:text-sm"
                id="cart-next-details"
              >
                <span>Inserir Endereço</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 'details' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('cart')}
                  className="p-3.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold text-xs shrink-0"
                >
                  Voltar
                </button>
                <button
                  onClick={handleApplyStepDetails}
                  className="flex-1 p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center justify-center space-x-1 select-none active:scale-99 transition-all text-xs"
                  id="details-next-payment"
                >
                  <span>Ir para Pagamento</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 'payment' && (
              <button
                onClick={() => setStep('details')}
                className="w-full p-3 bg-zinc-205 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 rounded-2xl font-bold transition-all text-xs"
              >
                Voltar para Endereço
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
