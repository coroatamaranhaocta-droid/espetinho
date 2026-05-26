import React from 'react';
import { Plus, Star, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const isAvailable = product.isAvailable;

  return (
    <div
      onClick={() => isAvailable && onSelect(product)}
      className={`group flex flex-col md:flex-row bg-white dark:bg-zinc-850 p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-rose-450 dark:hover:border-rose-900 shadow-sm hover:shadow-md transition-all duration-300 relative ${
        !isAvailable ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      id={`product-card-${product.id}`}
    >
      
      {/* Product Image and tags */}
      <div className="relative w-full md:w-36 h-36 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 mb-4 md:mb-0">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isPopular && isAvailable && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>Mais Pedido</span>
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-zinc-900/85 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Product Meta details */}
      <div className="flex-1 flex flex-col justify-between md:pl-4 text-left">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Action-row */}
        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-dashed border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-widest">Preço</span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              R$ {product.price.toFixed(2)}
            </span>
          </div>

          {isAvailable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="p-2 sm:p-2.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 rounded-xl transition-all duration-200 transform scale-100 hover:scale-105 active:scale-95"
              id={`add-${product.id}`}
              title="Adicionar ao carrinho"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
