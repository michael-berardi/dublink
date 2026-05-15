'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { MenuConfig, Category, Product, ServerToClientEvents, ClientToServerEvents } from '@/lib/types';
import { DEFAULT_CONFIG } from '@/lib/types';

export default function ConfigPage() {
  const params = useParams();
  const [sessionId, setSessionId] = useState<string>('');
  const [config, setConfig] = useState<MenuConfig>(DEFAULT_CONFIG);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'settings' | 'preview'>('menu');
  const [editingProduct, setEditingProduct] = useState<{ categoryId: string; product?: Product } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const sid = params.sessionId as string;
    if (sid) setSessionId(sid);
  }, [params.sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(undefined, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('session:join', sessionId, 'phone');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('session:update', (newConfig) => {
      setConfig(newConfig);
    });

    socket.on('error', (message) => {
      alert(message);
    });

    fetch('/api/socket');

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const emitConfig = (partial: Partial<MenuConfig>) => {
    socketRef.current?.emit('config:update', sessionId, partial);
  };

  const addCategory = () => {
    const name = prompt('Category name:');
    if (!name) return;
    socketRef.current?.emit('category:add', sessionId, {
      name,
      products: [],
      order: config.categories.length,
    });
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    socketRef.current?.emit('category:update', sessionId, categoryId, updates);
  };

  const removeCategory = (categoryId: string) => {
    if (!confirm('Delete this category and all its products?')) return;
    socketRef.current?.emit('category:remove', sessionId, categoryId);
  };

  const addProduct = (categoryId: string) => {
    setEditingProduct({ categoryId });
  };

  const saveProduct = (categoryId: string, product: Partial<Product>) => {
    if (editingProduct?.product) {
      socketRef.current?.emit('product:update', sessionId, categoryId, editingProduct.product.id, product);
    } else {
      socketRef.current?.emit('product:add', sessionId, categoryId, {
        name: product.name || 'New Product',
        price: product.price || 0,
        thc: product.thc || '',
        cbd: product.cbd || '',
        description: product.description || '',
        inStock: true,
        strain: product.strain,
      });
    }
    setEditingProduct(null);
  };

  const removeProduct = (categoryId: string, productId: string) => {
    socketRef.current?.emit('product:remove', sessionId, categoryId, productId);
  };

  const toggleStock = (categoryId: string, productId: string) => {
    socketRef.current?.emit('product:toggle-stock', sessionId, categoryId, productId);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-emerald-400">DUBLINK</h1>
              <p className="text-xs text-gray-500">Configure your menu</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="flex gap-2 bg-gray-900 rounded-xl p-1">
          {(['menu', 'settings', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold capitalize transition-colors ${
                activeTab === tab ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {activeTab === 'menu' && (
          <MenuTab 
            config={config}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onRemoveCategory={removeCategory}
            onAddProduct={addProduct}
            onRemoveProduct={removeProduct}
            onToggleStock={toggleStock}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            saveProduct={saveProduct}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab config={config} onUpdate={emitConfig} />
        )}

        {activeTab === 'preview' && (
          <PreviewTab config={config} sessionId={sessionId} />
        )}
      </main>

      {/* TV Link */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-center text-gray-500">
            TV URL: <span className="font-mono text-emerald-400">{typeof window !== 'undefined' ? `${window.location.origin}/tv/${sessionId}` : ''}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MenuTab({ 
  config, 
  onAddCategory, 
  onUpdateCategory, 
  onRemoveCategory,
  onAddProduct, 
  onRemoveProduct, 
  onToggleStock,
  editingProduct,
  setEditingProduct,
  saveProduct,
}: {
  config: MenuConfig;
  onAddCategory: () => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onRemoveCategory: (id: string) => void;
  onAddProduct: (categoryId: string) => void;
  onRemoveProduct: (categoryId: string, productId: string) => void;
  onToggleStock: (categoryId: string, productId: string) => void;
  editingProduct: { categoryId: string; product?: Product } | null;
  setEditingProduct: (p: { categoryId: string; product?: Product } | null) => void;
  saveProduct: (categoryId: string, product: Partial<Product>) => void;
}) {
  if (editingProduct) {
    return (
      <ProductForm 
        product={editingProduct.product}
        onSave={(p) => saveProduct(editingProduct.categoryId, p)}
        onCancel={() => setEditingProduct(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onAddCategory}
        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
      >
        + Add Category
      </button>

      {config.categories.map((category) => (
        <div key={category.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between bg-gray-800">
            <h3 className="font-bold text-lg">{category.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const name = prompt('New name:', category.name);
                  if (name) onUpdateCategory(category.id, { name });
                }}
                className="p-2 rounded-lg bg-gray-700 text-xs font-medium hover:bg-gray-600"
              >
                Rename
              </button>
              <button
                onClick={() => onRemoveCategory(category.id)}
                className="p-2 rounded-lg bg-red-900/50 text-red-400 text-xs font-medium hover:bg-red-900"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-800">
            {category.products.map((product) => (
              <div key={product.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{product.name}</p>
                    {!product.inStock && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400 font-medium">
                        Out
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {config.currency}{product.price}
                    {product.thc && ` · THC ${product.thc}`}
                    {product.cbd && ` · CBD ${product.cbd}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => onToggleStock(category.id, product.id)}
                    className={`p-2 rounded-lg text-xs font-medium ${
                      product.inStock 
                        ? 'bg-emerald-900/30 text-emerald-400' 
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {product.inStock ? 'In Stock' : 'Out'}
                  </button>
                  <button
                    onClick={() => setEditingProduct({ categoryId: category.id, product })}
                    className="p-2 rounded-lg bg-gray-800 text-xs font-medium hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onRemoveProduct(category.id, product.id)}
                    className="p-2 rounded-lg bg-red-900/30 text-red-400 text-xs font-medium hover:bg-red-900/50"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onAddProduct(category.id)}
            className="w-full py-2 px-4 text-sm text-emerald-400 font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Product
          </button>
        </div>
      ))}
    </div>
  );
}

function ProductForm({ 
  product, 
  onSave, 
  onCancel 
}: { 
  product?: Product;
  onSave: (p: Partial<Product>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    thc: product?.thc || '',
    cbd: product?.cbd || '',
    description: product?.description || '',
    strain: product?.strain || undefined,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">{product ? 'Edit Product' : 'New Product'}</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
            placeholder="Product name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Price</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Strain</label>
            <select
              value={form.strain || ''}
              onChange={(e) => setForm({ ...form, strain: e.target.value as any || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">None</option>
              <option value="indica">Indica</option>
              <option value="sativa">Sativa</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">THC</label>
            <input
              type="text"
              value={form.thc}
              onChange={(e) => setForm({ ...form, thc: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. 24%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">CBD</label>
            <input
              type="text"
              value={form.cbd}
              onChange={(e) => setForm({ ...form, cbd: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. 0.1%"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none resize-none"
            rows={2}
            placeholder="Optional description"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => onSave(form)}
          className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
        >
          Save Product
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SettingsTab({ config, onUpdate }: { config: MenuConfig; onUpdate: (c: Partial<MenuConfig>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Dispensary Name</label>
        <input
          type="text"
          value={config.dispensaryName}
          onChange={(e) => onUpdate({ dispensaryName: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Layout</label>
        <div className="grid grid-cols-3 gap-2">
          {(['grid', 'list', 'cards'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => onUpdate({ layout })}
              className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                config.layout === layout 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
        <div className="grid grid-cols-2 gap-2">
          {(['dark', 'light'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => onUpdate({ theme })}
              className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                config.theme === theme 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Font Size</label>
        <div className="grid grid-cols-3 gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => onUpdate({ fontSize: size })}
              className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                config.fontSize === size 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-400">Display Options</label>
        {[
          { key: 'showPrices', label: 'Show Prices' },
          { key: 'showThcCbd', label: 'Show THC/CBD' },
          { key: 'showStrain', label: 'Show Strain Type' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between py-2">
            <span className="text-sm">{label}</span>
            <button
              onClick={() => onUpdate({ [key]: !config[key as keyof MenuConfig] })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                config[key as keyof MenuConfig] ? 'bg-emerald-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                config[key as keyof MenuConfig] ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
        <div className="flex gap-2 flex-wrap">
          {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'].map((color) => (
            <button
              key={color}
              onClick={() => onUpdate({ primaryColor: color })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                config.primaryColor === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewTab({ config, sessionId }: { config: MenuConfig; sessionId: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Your TV should be showing this menu in real-time. If not, make sure the TV is connected.
      </p>
      
      <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
        <iframe
          src={`/tv/${sessionId}`}
          className="w-full h-96"
          style={{ pointerEvents: 'none' }}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-400">Quick Stats</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-2xl font-black text-emerald-400">
              {config.categories.reduce((acc, cat) => acc + cat.products.length, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Products</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-2xl font-black text-emerald-400">
              {config.categories.length}
            </p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-2xl font-black text-emerald-400">
              {config.categories.reduce((acc, cat) => acc + cat.products.filter(p => p.inStock).length, 0)}
            </p>
            <p className="text-xs text-gray-500">In Stock</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-2xl font-black text-red-400">
              {config.categories.reduce((acc, cat) => acc + cat.products.filter(p => !p.inStock).length, 0)}
            </p>
            <p className="text-xs text-gray-500">Out of Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}
