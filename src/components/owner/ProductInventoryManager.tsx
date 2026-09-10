import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Edit2,
  Trash2,
  ArrowUpDown,
  ShoppingBag,
  Building2,
  Sparkles,
  Check,
  X,
  Clock,
  Phone,
  User,
  Calendar,
  DollarSign,
  Layers,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Product, ProductOrder, Salon } from '../../types';
import {
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  updateProductOrderStatus,
} from '../../lib/api';

interface ProductInventoryManagerProps {
  salon: Salon | null;
  products: Product[];
  orders: ProductOrder[];
  onRefresh: () => void;
}

const CATEGORIES = [
  'Cuticle & Nail Care',
  'Nail Polish & Lacquer',
  'Gel & Acrylic Kits',
  'Nail Art & Glitters',
  'Tools & Accessories',
  'Lotions & Scrubs',
];

export const ProductInventoryManager: React.FC<ProductInventoryManagerProps> = ({
  salon,
  products,
  orders,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'orders'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');

  // Add/Edit Product Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cuticle & Nail Care',
    price: 350,
    stock_quantity: 10,
    low_stock_threshold: 5,
    volume_or_size: '15ml Bottle',
    sku: '',
    image_url: '',
    description: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Restock State
  const [adjustingStockId, setAdjustingStockId] = useState<number | null>(null);
  const [customStockInput, setCustomStockInput] = useState<{ [id: number]: string }>({});

  // Filter products for this salon
  const salonProducts = useMemo(() => {
    if (!salon) return products;
    return products.filter((p) => p.salon_id === salon.id);
  }, [products, salon]);

  // Salon specific pickup orders
  const salonOrders = useMemo(() => {
    if (!salon) return orders;
    return orders.filter((o) => o.salon_id === salon.id);
  }, [orders, salon]);

  // Inventory Metrics & Low Stock Notification Detection
  const metrics = useMemo(() => {
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    salonProducts.forEach((p) => {
      totalStockValue += p.price * p.stock_quantity;
      if (p.stock_quantity <= 0) {
        outOfStockCount++;
      } else if (p.stock_quantity <= (p.low_stock_threshold || 5)) {
        lowStockCount++;
      }
    });

    const pendingOrdersCount = salonOrders.filter(
      (o) => o.status === 'pending_pickup' || o.status === 'ready_for_pickup'
    ).length;

    return {
      totalProducts: salonProducts.length,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      pendingOrdersCount,
      needsAttentionCount: lowStockCount + outOfStockCount,
    };
  }, [salonProducts, salonOrders]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return salonProducts.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      
      const threshold = p.low_stock_threshold || 5;
      if (stockStatusFilter === 'low_stock' && (p.stock_quantity > threshold || p.stock_quantity <= 0)) {
        return false;
      }
      if (stockStatusFilter === 'out_of_stock' && p.stock_quantity > 0) {
        return false;
      }
      if (stockStatusFilter === 'in_stock' && p.stock_quantity <= threshold) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }

      return true;
    });
  }, [salonProducts, categoryFilter, stockStatusFilter, searchQuery]);

  // Open modal for Create or Edit
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Cuticle & Nail Care',
      price: 350,
      stock_quantity: 10,
      low_stock_threshold: 5,
      volume_or_size: '15ml Bottle',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      image_url: 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80',
      description: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 5,
      volume_or_size: product.volume_or_size || '',
      sku: product.sku || '',
      image_url: product.image_url || '',
      description: product.description || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Product title is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          category: formData.category,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
          low_stock_threshold: Number(formData.low_stock_threshold),
          volume_or_size: formData.volume_or_size.trim(),
          sku: formData.sku.trim(),
          image_url: formData.image_url.trim(),
          description: formData.description.trim(),
        });
      } else {
        await createProduct({
          salon_id: salon?.id || 1,
          name: formData.name.trim(),
          category: formData.category,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
          low_stock_threshold: Number(formData.low_stock_threshold),
          volume_or_size: formData.volume_or_size.trim(),
          sku: formData.sku.trim(),
          image_url: formData.image_url.trim(),
          description: formData.description.trim(),
        });
      }

      setIsFormModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}" from salon inventory?`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      onRefresh();
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const handleStockDelta = async (productId: number, delta: number) => {
    setAdjustingStockId(productId);
    try {
      await updateProductStock(productId, { delta });
      onRefresh();
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleDirectStockSubmit = async (productId: number) => {
    const rawVal = customStockInput[productId];
    if (rawVal === undefined || rawVal === '') return;
    const numeric = parseInt(rawVal, 10);
    if (isNaN(numeric) || numeric < 0) return;

    setAdjustingStockId(productId);
    try {
      await updateProductStock(productId, { stock_quantity: numeric });
      setCustomStockInput((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: any) => {
    try {
      await updateProductOrderStatus(orderId, status);
      onRefresh();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
              Studio Owner Portal
            </span>
            <span className="text-xs text-stone-400">• Inventory & Stock Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
            Products, Prices & Stock Manager
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your salon's retail catalog, monitor threshold alerts, and prepare in-store customer pickup packages.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="Refresh inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* High-Visibility Low Stock Alert Banner (Triggered when stock <= threshold) */}
      {metrics.needsAttentionCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-900">
                  Inventory Threshold Notification ({metrics.needsAttentionCount} Item{metrics.needsAttentionCount > 1 ? 's' : ''} Require Restock)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                {metrics.lowStockCount > 0 && (
                  <span>
                    <strong>{metrics.lowStockCount}</strong> product{metrics.lowStockCount > 1 ? 's are' : ' is'} currently at or below their configured low-stock threshold.
                  </span>
                )}
                {metrics.outOfStockCount > 0 && (
                  <span className="ml-1 text-red-700 font-semibold">
                    ({metrics.outOfStockCount} completely out of stock).
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveSubTab('inventory');
              setStockStatusFilter('low_stock');
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Review Low Stock Items
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Total Products
          </span>
          <div className="text-xl font-bold text-stone-900 mt-1 flex items-baseline gap-1.5">
            <span>{metrics.totalProducts}</span>
            <span className="text-xs font-normal text-stone-400">SKUs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Stock Valuation
          </span>
          <div className="text-xl font-bold text-stone-900 mt-1 text-pink-700">
            ₱{metrics.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Low Stock Alert</span>
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {metrics.lowStockCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Out of Stock
          </span>
          <div className={`text-xl font-bold mt-1 ${metrics.outOfStockCount > 0 ? 'text-red-600' : 'text-stone-900'}`}>
            {metrics.outOfStockCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-purple-500" />
            <span>Pickup Orders</span>
          </span>
          <div className="text-xl font-bold text-purple-700 mt-1">
            {metrics.pendingOrdersCount} Active
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Product Inventory vs In-Store Pickup Reservations */}
      <div className="border-b border-stone-200 flex items-center gap-6">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog & Stock Controls ({salonProducts.length})</span>
          {metrics.needsAttentionCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {metrics.needsAttentionCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'orders'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>In-Store Pickup Reservations ({salonOrders.length})</span>
          {metrics.pendingOrdersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
              {metrics.pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: PRODUCT CATALOG & STOCK CONTROLS */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Status Filters */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by product name, SKU, or category..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'low_stock', label: `Low Stock (${metrics.lowStockCount})` },
                  { id: 'out_of_stock', label: `Out of Stock (${metrics.outOfStockCount})` },
                  { id: 'in_stock', label: 'Healthy Stock' },
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setStockStatusFilter(status.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      stockStatusFilter === status.id
                        ? status.id === 'low_stock'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-stone-900 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-stone-400 shrink-0">Category:</span>
              {['All', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-pink-100 text-pink-700 font-bold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Stock Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-5">Product Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Store Price</th>
                    <th className="py-3.5 px-4">Stock Level & Threshold</th>
                    <th className="py-3.5 px-4 text-center">Quick Restock</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No products match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const threshold = p.low_stock_threshold || 5;
                      const isOutOfStock = p.stock_quantity <= 0;
                      const isLowStock = !isOutOfStock && p.stock_quantity <= threshold;
                      const isAdjusting = adjustingStockId === p.id;

                      // Calculate percentage for progress meter (max 20)
                      const meterPct = Math.min(100, Math.round((p.stock_quantity / Math.max(threshold * 2, 10)) * 100));

                      return (
                        <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                          {/* Details */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                              />
                              <div className="min-w-0 max-w-xs">
                                <h4 className="font-bold text-stone-900 line-clamp-1">
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                  {p.sku && <span className="font-mono text-[10px]">{p.sku}</span>}
                                  {p.volume_or_size && <span>• {p.volume_or_size}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-4 px-4 text-stone-600 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px]">
                              {p.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4 font-bold text-stone-900">
                            ₱{p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Stock Level & Threshold Indicator */}
                          <td className="py-4 px-4">
                            <div className="space-y-1.5 min-w-[140px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-black text-sm ${
                                  isOutOfStock
                                    ? 'text-red-600'
                                    : isLowStock
                                    ? 'text-amber-600'
                                    : 'text-stone-900'
                                }`}>
                                  {p.stock_quantity} unit{p.stock_quantity !== 1 ? 's' : ''}
                                </span>

                                <span className="text-[10px] text-stone-400 font-medium">
                                  (Alert &le; {threshold})
                                </span>
                              </div>

                              {/* Visual Stock Meter */}
                              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isOutOfStock
                                      ? 'bg-red-500 w-0'
                                      : isLowStock
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${meterPct}%` }}
                                />
                              </div>

                              {/* Status Tag */}
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                  <XCircle className="w-2.5 h-2.5" />
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Low Stock Warning
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Healthy Stock
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Quick Restock Buttons */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStockDelta(p.id, -1)}
                                disabled={isAdjusting || p.stock_quantity <= 0}
                                className="px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer text-xs"
                                title="Subtract 1 unit"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleStockDelta(p.id, 1)}
                                disabled={isAdjusting}
                                className="px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer text-xs"
                                title="Add 1 unit"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleStockDelta(p.id, 5)}
                                disabled={isAdjusting}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 cursor-pointer text-xs"
                                title="Restock +5 units"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => handleStockDelta(p.id, 10)}
                                disabled={isAdjusting}
                                className="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold border border-pink-200 cursor-pointer text-xs"
                                title="Restock +10 units"
                              >
                                +10
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Edit product details & prices"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: IN-STORE PICKUP RESERVATIONS */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between text-xs text-stone-600">
            <span>
              Showing {salonOrders.length} customer pickup order{salonOrders.length !== 1 ? 's' : ''} for {salon?.salon_name || 'your salon'}.
            </span>
            <span className="text-stone-400">
              Payments are settled physically at your salon counter upon collection.
            </span>
          </div>

          {salonOrders.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-900">No pickup orders yet</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                When customers reserve retail products from your salon catalog, their in-store pickup reservations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {salonOrders.map((order) => {
                const isPending = order.status === 'pending_pickup';
                const isReady = order.status === 'ready_for_pickup';
                const isCompleted = order.status === 'completed';
                const isCancelled = order.status === 'cancelled';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden"
                  >
                    {/* Order Bar */}
                    <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              #{order.order_number}
                            </span>
                            <span className="text-xs text-stone-400">
                              • Reserved {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-600 mt-0.5">
                            <span className="font-semibold text-stone-900 flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-400" />
                              {order.customer_name}
                            </span>
                            <span className="flex items-center gap-1 text-stone-500">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {order.customer_phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Action Buttons */}
                      <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Ready for Pickup</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Complete & Settle in Store</span>
                          </button>
                        )}

                        {!isCompleted && !isCancelled && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Settled at Counter</span>
                          </span>
                        )}

                        {isCancelled && (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            Cancelled (Stock Restored)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Pickup Details */}
                      <div className="flex items-center gap-4 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            Target Pickup: <strong>{order.pickup_date}</strong> at{' '}
                            <strong>{order.pickup_time || '14:00'}</strong>
                          </span>
                        </div>
                        {order.notes && (
                          <div className="text-stone-500 italic pl-3 border-l border-stone-200">
                            Note: "{order.notes}"
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-stone-100 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
                                alt={item.product_name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                              />
                              <div>
                                <span className="font-semibold text-stone-900">{item.product_name}</span>
                                <div className="text-[11px] text-stone-400">
                                  Qty: {item.quantity} {item.volume_or_size ? `• ${item.volume_or_size}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className="font-bold text-stone-900">
                              ₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total Bar */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500">Collect in Physical Store:</span>
                        <span className="text-base font-black text-pink-700">
                          ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-8 relative">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {editingProduct ? 'Edit Product & Stock' : 'Add New Salon Product'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Configure pricing, initial inventory, and low stock threshold alerts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Organic Cuticle Revitalizing Dropper"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                />
              </div>

              {/* Category & Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Volume / Unit</label>
                  <input
                    type="text"
                    value={formData.volume_or_size}
                    onChange={(e) => setFormData({ ...formData, volume_or_size: e.target.value })}
                    placeholder="e.g. 15ml, 30g, 1 Set"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Price & Initial Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Price (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>Low Threshold</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value, 10) || 0 })}
                    title="System triggers low stock notification when units fall to or below this value"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-amber-50/50 font-bold text-amber-900"
                  />
                </div>
              </div>

              {/* SKU & Image URL */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">SKU / Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. POL-001"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Product Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, formulation notes, application instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Threshold Alert:</strong> The dashboard will notify you whenever current stock drops to &le; {formData.low_stock_threshold} units.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
