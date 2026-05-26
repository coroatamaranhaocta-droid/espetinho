import React, { useState } from 'react';
import { X, Plus, Minus, FileText, ShoppingBag } from 'lucide-react';
import { Product, ProductSize, ProductOption, CartItem } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(product.sizes?.[0]);
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([]);
  const [observation, setObservation] = useState('');

  const increment = () => setQuantity((prev) => prev + 1);
  const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleToggleOption = (option: ProductOption) => {
    setSelectedOptions((prev) =>
      prev.some((o) => o.id === option.id)
        ? prev.filter((o) => o.id !== option.id)
        : [...prev, option]
    );
  };

  // Calculate dynamic active unit total
  const sizeAdjustment = selectedSize ? selectedSize.priceAdjustment : 0;
  const optionsAddition = selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const unitPrice = product.price + sizeAdjustment + optionsAddition;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart({
      product,
      quantity,
      selectedSize,
      selectedOptions,
      observation
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="product-modal">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Close Button Trigger */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          id="product-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner image */}
        <div className="relative h-44 sm:h-56 w-full shrink-0">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {product.name}
            </h2>
            <span className="text-rose-450 font-bold text-sm bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              R$ {product.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customizable options Scroll-block */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left custom-scrollbar">
          
          {/* Description */}
          <div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          {/* Sizes options block */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Escolha o Tamanho:</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`p-3 rounded-2xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                      selectedSize?.id === size.id
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-500 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span>{size.name}</span>
                    <span className="text-[11px] font-bold opacity-80">
                      {size.priceAdjustment >= 0 ? '+' : ''} R$ {size.priceAdjustment.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Incremental extra options selection bar */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Adicionais:</h3>
              <div className="space-y-1.5">
                {product.options.map((opt) => {
                  const isChecked = selectedOptions.some((o) => o.id === opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleOption(opt)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                        isChecked
                          ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-450 text-rose-650 dark:text-rose-400'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-xs font-medium">{opt.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-zinc-400">+ R$ {opt.price.toFixed(2)}</span>
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                          isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-zinc-300'
                        }`}>
                          {isChecked && <span className="text-[10px]">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Alguma observação?</span>
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: sem cebola, maionese no hambúrguer, etc."
              className="w-full text-xs sm:text-sm p-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-850 rounded-2xl focus:ring-1 focus:ring-rose-500 outline-none resize-none duration-250 min-h-[70px]"
            />
          </div>

        </div>

        {/* Footer Checkout Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shrink-0 transition-colors">
          
          {/* Quantity selector */}
          <div className="flex items-center space-x-3 bg-zinc-200/60 dark:bg-zinc-850 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={decrement}
              className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors active:scale-95 text-lg"
              title="Reduzir"
              id="modal-qty-dec"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 font-extrabold text-zinc-800 dark:text-zinc-200 text-sm select-none text-center">
              {quantity}
            </span>
            <button
              onClick={increment}
              className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors active:scale-95 text-lg"
              title="Aumentar"
              id="modal-qty-inc"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAdd}
            className="flex-1 w-full flex items-center justify-between p-3.5 sm:p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/10 active:scale-99 transition-all text-xs sm:text-sm"
            id="modal-add-to-cart"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5" />
              Adicionar ao Carrinho
            </span>
            <span className="bg-rose-700 px-3 py-1 rounded-xl block text-white font-black text-sm">
              R$ {totalPrice.toFixed(2)}
            </span>
          </button>
          
        </div>

      </div>
    </div>
  );
}
