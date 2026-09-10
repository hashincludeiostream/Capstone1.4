import React, { useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { CartItem } from '../../types';
import { scrollToElement } from '../../utils/scrollHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  targetProductId?: number | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onContinueShopping,
  targetProductId,
}) => {
  useEffect(() => {
    if (isOpen && targetProductId) {
      scrollToElement(`cart-drawer-item-${targetProductId}`);
    }
  }, [isOpen, targetProductId]);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Group items by salon
  const itemsBySalon = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
    const salonName = item.product.salon_name || 'Verified Salon';
    if (!acc[salonName]) acc[salonName] = [];
    acc[salonName].push(item);
    return acc;
  }, {});

  const salonNames = Object.keys(itemsBySalon);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200">
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Your Product Cart</h2>
                <p className="text-xs text-stone-500">
                  {totalCount} item{totalCount !== 1 ? 's' : ''} reserved for in-store pickup
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {cartItems.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Your cart is empty</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    Explore our salon catalog to add professional nail polishes, cuticle oils, and beauty kits.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onContinueShopping();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Browse Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Physical Settlement Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">In-Store Physical Settlement</span>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                      Products are prepared for pickup at the salon counter. No card or digital payment is processed here; simply pay upon physical collection.
                    </p>
                  </div>
                </div>

                {/* Items Grouped by Salon */}
                {salonNames.map((salon) => (
                  <div key={salon} className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 uppercase tracking-wider pb-1 border-b border-stone-100">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{salon}</span>
                    </div>

                    <div className="space-y-3">
                      {itemsBySalon[salon].map((item) => {
                        const maxStock = item.product.stock_quantity;
                        const atMaxStock = item.quantity >= maxStock;

                        return (
                          <div
                            key={item.product.id}
                            id={`cart-drawer-item-${item.product.id}`}
                            className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3.5"
                          >
                            {/* Product Thumbnail */}
                            <img
                              src={item.product.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 rounded-xl object-cover bg-stone-200 shrink-0 border border-stone-200"
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                                {item.product.name}
                              </h4>
                              {item.product.volume_or_size && (
                                <p className="text-[10px] text-stone-500">
                                  {item.product.volume_or_size}
                                </p>
                              )}
                              <div className="text-xs font-black text-stone-900 mt-1">
                                ₱{(item.product.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                {item.quantity > 1 && (
                                  <span className="text-[10px] font-normal text-stone-400 ml-1">
                                    (₱{item.product.price} each)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls & Remove */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <button
                                onClick={() => onRemoveItem(item.product.id)}
                                className="text-stone-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                                  className="p-1 hover:bg-stone-100 text-stone-600 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-stone-800 min-w-[1.5rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                                  disabled={atMaxStock}
                                  className="p-1 hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer"
                                  title={atMaxStock ? 'Max stock reached' : 'Increase quantity'}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-stone-400 hover:text-red-600 font-medium transition-colors cursor-pointer"
                  >
                    Clear All Items
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer & Settlement Action */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50/60 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Subtotal ({totalCount} items)</span>
                  <span>₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>In-Studio Pickup Fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-900 font-bold block">Counter Total</span>
                    <span className="text-[10px] text-stone-400">Pay upon physical pickup</span>
                  </div>
                  <span className="text-xl font-black text-stone-900">
                    ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Proceed to Reserve In-Store Pickup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
