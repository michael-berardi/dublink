'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { MenuConfig, Product, ServerToClientEvents, ClientToServerEvents } from '@/lib/types';
import { DEFAULT_CONFIG } from '@/lib/types';

function getConfigUrl(sessionId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/config/${sessionId}`;
}

function strainBadge(strain?: string) {
  if (!strain) return null;
  const colors: Record<string, string> = {
    indica: 'bg-purple-600',
    sativa: 'bg-yellow-600',
    hybrid: 'bg-emerald-600',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${colors[strain] || 'bg-gray-600'}`}>
      {strain}
    </span>
  );
}

export default function TVDisplay() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string>('');
  const [config, setConfig] = useState<MenuConfig>(DEFAULT_CONFIG);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isPaired, setIsPaired] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    const sid = (params.sessionId as string) || `tv-${Date.now()}`;
    setSessionId(sid);
  }, [params.sessionId]);

  // Generate QR code
  useEffect(() => {
    if (!sessionId) return;
    const url = getConfigUrl(sessionId);
    QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#10b981', light: '#000000' } })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [sessionId]);

  // Socket connection
  useEffect(() => {
    if (!sessionId) return;

    const socket = io(undefined, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('session:join', sessionId, 'tv');
    });

    socket.on('session:update', (newConfig) => {
      setConfig(newConfig);
    });

    socket.on('session:paired', () => {
      setIsPaired(true);
    });

    socket.on('session:connected', (role) => {
      if (role === 'phone') setIsPaired(true);
    });

    socket.on('session:disconnected', (role) => {
      if (role === 'phone') setIsPaired(false);
    });

    // Initialize socket endpoint
    fetch('/api/socket');

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // Auto fullscreen
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Auto-enter fullscreen after a short delay
    const timer = setTimeout(() => {
      enterFullscreen();
    }, 2000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearTimeout(timer);
    };
  }, [enterFullscreen]);

  const fontSizeClass = config.fontSize === 'small' ? 'text-sm' : config.fontSize === 'large' ? 'text-xl' : 'text-base';
  const bgClass = config.theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white';

  // Show setup overlay initially
  if (showSetup) {
    return (
      <div 
        ref={containerRef}
        className={`min-h-screen flex flex-col items-center justify-center ${bgClass} p-8`}
        onClick={enterFullscreen}
      >
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2" style={{ color: config.primaryColor }}>
              DUBLINK
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 font-medium">
              by DubHaven
            </p>
          </div>

          {qrDataUrl && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-2xl">
                <img src={qrDataUrl} alt="Scan to configure" className="w-64 h-64 md:w-80 md:h-80" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold">
                  Scan to Configure
                </p>
                <p className="text-lg text-gray-500">
                  Point your phone camera at the QR code
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSetup(false); }}
              className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
              style={{ backgroundColor: config.primaryColor, color: '#000' }}
            >
              Show Demo Menu
            </button>
            
            {!isFullscreen && (
              <button
                onClick={(e) => { e.stopPropagation(); enterFullscreen(); }}
                className="px-6 py-3 rounded-xl font-semibold text-sm bg-gray-800 text-white hover:bg-gray-700 transition-all"
              >
                Enter Fullscreen Mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Menu display
  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${bgClass} ${fontSizeClass} overflow-hidden`}
      onClick={enterFullscreen}
    >
      {/* Header */}
      <header 
        className="px-8 py-6 flex items-center justify-between border-b"
        style={{ 
          borderColor: config.primaryColor + '40',
          backgroundColor: config.theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
        }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: config.primaryColor }}>
            {config.dispensaryName}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-500 uppercase tracking-wider">Menu</p>
            <p className="text-2xl font-bold">{config.categories.reduce((acc, cat) => acc + cat.products.length, 0)} Items</p>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="p-8">
        {config.categories.map((category) => (
          <section key={category.id} className="mb-12">
            <h2 
              className="text-3xl md:text-4xl font-black mb-6 pb-3 border-b-2 uppercase tracking-wide"
              style={{ 
                color: config.primaryColor,
                borderColor: config.primaryColor
              }}
            >
              {category.name}
            </h2>

            {config.layout === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} config={config} />
                ))}
              </div>
            ) : config.layout === 'list' ? (
              <div className="space-y-3">
                {category.products.map((product) => (
                  <ProductRow key={product.id} product={product} config={config} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.products.map((product) => (
                  <ProductCardLarge key={product.id} product={product} config={config} />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer 
        className="fixed bottom-0 left-0 right-0 px-8 py-4 flex justify-between items-center text-sm"
        style={{ backgroundColor: config.theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }}
      >
        <p className="text-gray-500">Powered by Dublink</p>
        <p className="text-gray-500">Scan QR to update menu</p>
      </footer>
    </div>
  );
}

function ProductCard({ product, config }: { product: Product; config: MenuConfig }) {
  const isDark = config.theme === 'dark';
  return (
    <div 
      className={`rounded-xl p-5 border-2 transition-opacity ${
        product.inStock ? '' : 'opacity-40'
      }`}
      style={{ 
        borderColor: config.primaryColor + '30',
        backgroundColor: isDark ? '#111' : '#f9fafb'
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold leading-tight">{product.name}</h3>
        {config.showPrices && (
          <span className="text-2xl font-black" style={{ color: config.primaryColor }}>
            {config.currency}{product.price}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {config.showStrain && strainBadge(product.strain)}
        {config.showThcCbd && product.thc && (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800 text-gray-300">
            THC {product.thc}
          </span>
        )}
        {config.showThcCbd && product.cbd && (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800 text-gray-300">
            CBD {product.cbd}
          </span>
        )}
      </div>

      {!product.inStock && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white uppercase tracking-wider">
          Out of Stock
        </span>
      )}
    </div>
  );
}

function ProductCardLarge({ product, config }: { product: Product; config: MenuConfig }) {
  const isDark = config.theme === 'dark';
  return (
    <div 
      className={`rounded-2xl p-6 border-2 transition-opacity ${
        product.inStock ? '' : 'opacity-40'
      }`}
      style={{ 
        borderColor: config.primaryColor + '30',
        backgroundColor: isDark ? '#111' : '#f9fafb'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {config.showStrain && strainBadge(product.strain)}
            {config.showThcCbd && product.thc && (
              <span className="text-sm font-semibold px-3 py-1 rounded-lg bg-gray-800 text-gray-300">
                THC {product.thc}
              </span>
            )}
            {config.showThcCbd && product.cbd && (
              <span className="text-sm font-semibold px-3 py-1 rounded-lg bg-gray-800 text-gray-300">
                CBD {product.cbd}
              </span>
            )}
          </div>
        </div>
        {config.showPrices && (
          <span className="text-3xl font-black" style={{ color: config.primaryColor }}>
            {config.currency}{product.price}
          </span>
        )}
      </div>
      
      {product.description && (
        <p className="text-gray-400 text-sm mb-4">{product.description}</p>
      )}

      {!product.inStock && (
        <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-red-600 text-white uppercase tracking-wider">
          Out of Stock
        </span>
      )}
    </div>
  );
}

function ProductRow({ product, config }: { product: Product; config: MenuConfig }) {
  return (
    <div 
      className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-opacity ${
        product.inStock ? '' : 'opacity-40'
      }`}
      style={{ 
        borderColor: config.primaryColor + '20',
        backgroundColor: config.theme === 'dark' ? '#111' : '#f9fafb'
      }}
    >
      <div className="flex items-center gap-6">
        <h3 className="text-xl font-bold">{product.name}</h3>
        <div className="flex items-center gap-2">
          {config.showStrain && strainBadge(product.strain)}
          {config.showThcCbd && product.thc && (
            <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">THC {product.thc}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!product.inStock && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white uppercase">
            Out of Stock
          </span>
        )}
        {config.showPrices && (
          <span className="text-2xl font-black" style={{ color: config.primaryColor }}>
            {config.currency}{product.price}
          </span>
        )}
      </div>
    </div>
  );
}
