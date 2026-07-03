import { MenuConfig, DEFAULT_CONFIG } from './types';
import { getCookieValue, verifyToken, isSubscriptionActive, getAccount, jsonResponse } from './auth';

export interface Env {
  SESSION: DurableObjectNamespace;
  ACCOUNTS: DurableObjectNamespace;
  BROWSERLESS_TOKEN?: string;
  RESEND_API_KEY?: string;
  AUTH_SECRET?: string;
}

interface WSConnection {
  socket: WebSocket;
  role: 'tv' | 'phone';
  id: string;
  lastPong: number;
  accountId?: string;
}

interface StoredSession {
  config: MenuConfig;
  ownerAccountId?: string;
}

interface WSMessage {
  type: string;
  payload?: any;
}

// Security and rate limiting constants
const MAX_MESSAGE_SIZE = 65536; // 64KB
const MAX_CONNECTIONS = 50;
const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 90000;
const MESSAGE_RATE_LIMIT = 30; // messages per 10 seconds per connection
const RATE_LIMIT_WINDOW_MS = 10000;

// Valid session ID pattern
export const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export class SessionDurableObject implements DurableObject {
  private connections: Map<string, WSConnection> = new Map();
  private config: MenuConfig;
  private state: DurableObjectState;
  private env: Env;
  private initialized: boolean = false;
  private initializePromise: Promise<void> | null = null;
  private messageCounts: Map<string, { count: number; resetAt: number }> = new Map();
  private heartbeatTimer: number | null = null;
  private ownerAccountId?: string;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    const cloned = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MenuConfig;
    cloned.categories.forEach((cat) => {
      cat.products.forEach((p) => {
        delete (p as Partial<typeof p>).image;
      });
    });
    this.config = cloned;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    // Serialize concurrent first-fetch races: blockConcurrencyWhile
    // blocks all other operations on the DO until the callback resolves,
    // guaranteeing the one-time storage read happens exactly once.
    if (!this.initializePromise) {
      this.initializePromise = this.state.blockConcurrencyWhile(async () => {
        if (this.initialized) return;
        try {
          const stored = await this.state.storage.get<StoredSession>('session');
          if (stored) {
            if (this.isValidConfig(stored.config)) {
              this.config = stored.config;
            }
            if (stored.ownerAccountId) {
              this.ownerAccountId = stored.ownerAccountId;
            }
          }
        } catch (err) {
          console.error('Failed to load persisted config:', err);
        }
        this.initialized = true;
      });
    }
    await this.initializePromise;
  }

  private async persistConfig(): Promise<void> {
    try {
      this.config = { ...this.config, updatedAt: new Date().toISOString() };
      const stored: StoredSession = { config: this.config };
      if (this.ownerAccountId) stored.ownerAccountId = this.ownerAccountId;
      await this.state.storage.put('session', stored);
    } catch (err) {
      console.error('Failed to persist config:', err);
    }
  }

  private isValidConfig(config: any): config is MenuConfig {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.dispensaryName === 'string' &&
      typeof config.primaryColor === 'string' &&
      typeof config.secondaryColor === 'string' &&
      typeof config.showStrain === 'boolean' &&
      typeof config.showLogo === 'boolean' &&
      typeof config.showDescription === 'boolean' &&
      typeof config.showImages === 'boolean' &&
      typeof config.showBrand === 'boolean' &&
      typeof config.showPromos === 'boolean' &&
      typeof config.currency === 'string' &&
      Array.isArray(config.categories) &&
      ['grid', 'list', 'cards', 'compact'].includes(config.layout) &&
      ['auto', 'columns', 'pricelist', 'compact', 'grid'].includes(config.layoutMode) &&
      ['small', 'medium', 'large'].includes(config.fontSize) &&
      ['dark', 'light'].includes(config.theme) &&
      ['default', 'minimal', 'neon', 'light', 'sunset', 'forest', 'royal', 'gold', 'ocean', 'crimson', 'bone', 'vapor'].includes(config.template) &&
      typeof config.displayCount === 'number'
    );
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialize();

    const url = new URL(request.url);

    if (url.pathname === '/probe' && request.method === 'GET') {
      return jsonResponse({ ok: true, connections: this.connections.size, config: this.config.dispensaryName });
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      const role = url.searchParams.get('role') as 'tv' | 'phone' | null;
      if (role === 'phone') {
        const cookie = getCookieValue(request, 'dubmenu_auth');
        if (!cookie || !this.env.AUTH_SECRET) {
          return new Response('Authentication required for config access', { status: 401 });
        }
        const token = await verifyToken(cookie, this.env.AUTH_SECRET);
        if (!token) {
          return new Response('Invalid or expired session', { status: 403 });
        }
        // Add account id to request for handleWebSocket
        request = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        (request as any).dubmenuAccountId = token.accountId;
      }
      return this.handleWebSocket(request, role || 'tv');
    }

    // HTTP status endpoint for TV polling fallback.
    // Returns ONLY minimal pairing state — never the full config.
    // The TV receives the config over the authenticated WebSocket path
    // (or on connect via the initial config push), not through this
    // unauthenticated endpoint.
    if (url.pathname === '/status') {
      const hasTv = Array.from(this.connections.values()).some(c => c.role === 'tv');
      const hasPhone = Array.from(this.connections.values()).some(c => c.role === 'phone');
      return new Response(JSON.stringify({
        paired: hasTv && hasPhone,
        hasPhone: hasPhone,
        hasTv: hasTv,
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Internal import endpoint used by the Worker after Dutchie scrape.
    if (url.pathname === '/import' && request.method === 'POST') {
      try {
        const accountId = request.headers.get('X-Account-Id') || undefined;
        if (!accountId) {
          return new Response(JSON.stringify({ ok: false, error: 'Owner required' }), { status: 403 });
        }
        if (this.ownerAccountId && this.ownerAccountId !== accountId) {
          return new Response(JSON.stringify({ ok: false, error: 'Not owner' }), { status: 403 });
        }
        const data = await request.json() as any;
        if (!this.isValidImportedCategories(data?.categories)) {
          return new Response(JSON.stringify({ ok: false, error: 'Invalid imported categories' }), { status: 400 });
        }

        this.config = {
          ...this.config,
          dispensaryName: typeof data.dispensaryName === 'string' ? this.sanitizeString(data.dispensaryName) : this.config.dispensaryName,
          categories: this.sanitizeCategories(data.categories),
          layoutMode: 'auto',
          showImages: true,
          showBrand: true,
          showStrain: true,
        };
        if (!this.ownerAccountId) {
          this.ownerAccountId = accountId;
        }
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        return new Response(JSON.stringify({ ok: true, config: this.config }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: 'Import failed' }), { status: 500 });
      }
    }

    // Internal endpoint to set/check owner (POST only — never expose owner
    // identity unauthenticated). index.ts uses POST exclusively.
    if (url.pathname === '/owner' && request.method === 'POST') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      if (!accountId) return new Response('Missing account', { status: 400 });
      if (this.ownerAccountId && this.ownerAccountId !== accountId) {
        return new Response(JSON.stringify({ owned: true }), { status: 403 });
      }
      if (!this.ownerAccountId) {
        this.ownerAccountId = accountId;
        await this.persistConfig();
      }
      return new Response(JSON.stringify({ ownerAccountId: this.ownerAccountId }));
    }

    // Internal endpoint to export config (owner only)
    if (url.pathname === '/config' && request.method === 'GET') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      if (!accountId) return new Response('Missing account', { status: 400 });
      if (this.ownerAccountId && this.ownerAccountId !== accountId) {
        return new Response('Forbidden', { status: 403 });
      }
      return jsonResponse({ config: this.config });
    }

    // Public endpoint for embeddable widget (no auth required, read-only menu data)
    if (url.pathname === '/widget' && request.method === 'GET') {
      return jsonResponse({
        dispensaryName: this.config.dispensaryName,
        categories: this.config.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          order: cat.order,
          products: cat.products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            thc: p.thc,
            cbd: p.cbd,
            weight: p.weight,
            brand: p.brand,
            strain: p.strain,
            inStock: p.inStock,
            isPromo: p.isPromo,
          })),
        })),
        layout: this.config.layout,
        theme: this.config.theme,
        primaryColor: this.config.primaryColor,
        secondaryColor: this.config.secondaryColor,
        promoBanner: this.config.promoBanner,
        updatedAt: this.config.updatedAt,
      });
    }

    // Internal wipe endpoint used by account deletion (GDPR/CCPA cascade).
    // Closes every live WebSocket after notifying peers, then clears all
    // durable storage and in-memory state. Returns 200. The caller is the
    // Worker router, which has already verified the requesting account owns
    // this session before invoking.
    if (url.pathname === '/' && request.method === 'DELETE') {
      try {
        this.broadcast({ type: 'session_deleted' });
      } catch (_err) {
        // ignore broadcast failures during teardown
      }
      for (const [, conn] of this.connections) {
        try { conn.socket.close(1001, 'Session deleted'); } catch (_err) { /* ignore */ }
      }
      this.connections.clear();
      this.messageCounts.clear();
      if (this.heartbeatTimer !== null) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      await this.state.storage.deleteAll();
      const cloned = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MenuConfig;
      cloned.categories.forEach((cat) => {
        cat.products.forEach((p) => {
          delete (p as Partial<typeof p>).image;
        });
      });
      this.config = cloned;
      this.ownerAccountId = undefined;
      this.initialized = true;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocket(request: Request, role: 'tv' | 'phone'): Response {
    if (this.connections.size >= MAX_CONNECTIONS) {
      return new Response('Too many connections', { status: 503 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    const connId = crypto.randomUUID();
    const accountId = (request as any).dubmenuAccountId as string | undefined;

    this.connections.set(connId, { socket: server, role, id: connId, lastPong: Date.now(), accountId });

    this.startHeartbeat();

    server.addEventListener('message', async (event) => {
      try {
        const data = event.data as string;
        if (data.length > MAX_MESSAGE_SIZE) {
          server.close(1009, 'Message too large');
          return;
        }
        if (!this.checkRateLimit(connId)) {
          server.close(1008, 'Rate limit exceeded');
          return;
        }
        const msg: WSMessage = JSON.parse(data);
        if (!msg || typeof msg.type !== 'string') return;
        await this.handleMessage(msg, connId, server);
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    server.addEventListener('close', () => this.cleanupConnection(connId));
    server.addEventListener('error', () => this.cleanupConnection(connId));

    // Send current config on connect for TV
    if (role === 'tv') {
      server.send(JSON.stringify({ type: 'config', payload: this.config }));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  private checkRateLimit(connId: string): boolean {
    const now = Date.now();
    const record = this.messageCounts.get(connId);
    if (!record || now > record.resetAt) {
      this.messageCounts.set(connId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    if (record.count >= MESSAGE_RATE_LIMIT) {
      return false;
    }
    record.count++;
    return true;
  }

  private cleanupConnection(connId: string): void {
    const conn = this.connections.get(connId);
    if (conn) {
      this.connections.delete(connId);
      this.messageCounts.delete(connId);
      this.broadcast({
        type: 'peer_disconnected',
        payload: { role: conn.role }
      }, connId);
    }
    
    // Stop heartbeat if no connections
    if (this.connections.size === 0 && this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer !== null) return;
    
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const deadConnections: string[] = [];
      
      for (const [id, conn] of this.connections) {
        // Check for dead connections
        if (now - conn.lastPong > HEARTBEAT_TIMEOUT_MS) {
          deadConnections.push(id);
          continue;
        }
        
        // Send ping
        try {
          conn.socket.send(JSON.stringify({ type: 'ping' }));
        } catch (err) {
          deadConnections.push(id);
        }
      }
      
      for (const id of deadConnections) {
        const conn = this.connections.get(id);
        if (conn) {
          try { conn.socket.close(1001, 'Heartbeat timeout'); } catch (e) {}
          this.cleanupConnection(id);
        }
      }
    }, HEARTBEAT_INTERVAL_MS) as unknown as number;
  }

  private async handleMessage(
    msg: WSMessage,
    connId: string,
    server: WebSocket
  ): Promise<void> {
    const conn = this.connections.get(connId);
    if (!conn) return;

    switch (msg.type) {
      case 'join': {
        // Use connection role already set at upgrade time
        server.send(JSON.stringify({ type: 'config', payload: this.config }));
        this.broadcast({ type: 'peer_connected', payload: { role: conn.role } }, connId);
        const hasTv = Array.from(this.connections.values()).some(c => c.role === 'tv');
        const hasPhone = Array.from(this.connections.values()).some(c => c.role === 'phone');
        if (hasTv && hasPhone) this.broadcast({ type: 'paired' });
        break;
      }

      case 'pong': {
        conn.lastPong = Date.now();
        break;
      }

      case 'config_update': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!this.isValidConfigUpdate(payload)) return;
        const sanitizedPayload = { ...payload };
        if (sanitizedPayload.complianceState !== undefined) {
          const cs = this.sanitizeComplianceState(sanitizedPayload.complianceState);
          if (cs) sanitizedPayload.complianceState = cs;
          else if (sanitizedPayload.complianceState === '') sanitizedPayload.complianceState = '';
          else delete sanitizedPayload.complianceState;
        }
        this.config = { ...this.config, ...sanitizedPayload };
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'config_replace': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!payload || typeof payload !== 'object' || !this.isValidImportedCategories(payload.categories)) return;
        this.config = { ...this.config, ...payload, categories: this.sanitizeCategories(payload.categories) };
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'category_add': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!this.isValidCategoryAdd(payload)) return;
        const newCategory = {
          id: `cat-${crypto.randomUUID()}`,
          name: this.sanitizeString(payload.name),
          order: typeof payload.order === 'number' ? Math.max(0, Math.floor(payload.order)) : 0,
          products: []
        };
        this.config.categories.push(newCategory);
        this.config.categories.sort((a, b) => a.order - b.order);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'category_update': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!this.isValidCategoryUpdate(payload)) return;

        const cat = this.config.categories.find(c => c.id === payload.categoryId);
        if (!cat) return;

        const updates = payload.updates;
        if (typeof updates.name === 'string') {
          cat.name = this.sanitizeString(updates.name);
        }
        if (typeof updates.order === 'number') {
          cat.order = Math.max(0, Math.floor(updates.order));
        }
        
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'category_remove': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!payload || typeof payload !== 'object' || typeof payload.categoryId !== 'string') return;

        this.config.categories = this.config.categories.filter(
          c => c.id !== payload.categoryId
        );
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_add': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!this.isValidProductAdd(payload)) return;

        const targetCat = this.config.categories.find(c => c.id === payload.categoryId);
        if (!targetCat) return;

        const product = {
          id: `prod-${crypto.randomUUID()}`,
          name: this.sanitizeString(payload.product.name),
          price: this.sanitizePrice(payload.product.price),
          originalPrice: payload.product.originalPrice ? this.sanitizePrice(payload.product.originalPrice) : undefined,
          thc: payload.product.thc ? this.sanitizeString(payload.product.thc) : undefined,
          cbd: payload.product.cbd ? this.sanitizeString(payload.product.cbd) : undefined,
          description: payload.product.description ? this.sanitizeString(payload.product.description) : undefined,
          image: payload.product.image ? this.sanitizeString(payload.product.image) : undefined,
          weight: payload.product.weight ? this.sanitizeString(payload.product.weight) : undefined,
          brand: payload.product.brand ? this.sanitizeString(payload.product.brand) : undefined,
          inStock: payload.product.inStock !== false,
          strain: ['indica', 'sativa', 'hybrid'].includes(payload.product.strain) 
            ? payload.product.strain 
            : undefined,
          isPromo: Boolean(payload.product.isPromo)
        };

        targetCat.products.push(product);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_update': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!this.isValidProductUpdate(payload)) return;

        const pc = this.config.categories.find(c => c.id === payload.categoryId);
        if (!pc) return;

        const prod = pc.products.find(p => p.id === payload.productId);
        if (!prod) return;

        const updates = payload.updates;
        if (typeof updates.name === 'string') {
          prod.name = this.sanitizeString(updates.name);
        }
        if (typeof updates.price === 'number') {
          prod.price = this.sanitizePrice(updates.price);
        }
        if (updates.originalPrice !== undefined) {
          prod.originalPrice = updates.originalPrice ? this.sanitizePrice(updates.originalPrice) : undefined;
        }
        if (updates.thc !== undefined) {
          prod.thc = updates.thc ? this.sanitizeString(updates.thc) : undefined;
        }
        if (updates.cbd !== undefined) {
          prod.cbd = updates.cbd ? this.sanitizeString(updates.cbd) : undefined;
        }
        if (updates.description !== undefined) {
          prod.description = updates.description ? this.sanitizeString(updates.description) : undefined;
        }
        if (updates.image !== undefined) {
          prod.image = updates.image ? this.sanitizeString(updates.image) : undefined;
        }
        if (updates.weight !== undefined) {
          prod.weight = updates.weight ? this.sanitizeString(updates.weight) : undefined;
        }
        if (updates.brand !== undefined) {
          prod.brand = updates.brand ? this.sanitizeString(updates.brand) : undefined;
        }
        if (updates.inStock !== undefined) {
          prod.inStock = Boolean(updates.inStock);
        }
        if (updates.strain !== undefined) {
          prod.strain = ['indica', 'sativa', 'hybrid'].includes(updates.strain) 
            ? updates.strain 
            : undefined;
        }
        if (updates.isPromo !== undefined) {
          prod.isPromo = Boolean(updates.isPromo);
        }

        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_remove': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!payload || typeof payload !== 'object' || 
            typeof payload.categoryId !== 'string' || typeof payload.productId !== 'string') return;

        const rc = this.config.categories.find(c => c.id === payload.categoryId);
        if (!rc) return;

        rc.products = rc.products.filter(p => p.id !== payload.productId);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_toggle_stock': {
        if (!this.canModifyConfig(conn)) return;
        const payload = msg.payload;
        if (!payload || typeof payload !== 'object' || 
            typeof payload.categoryId !== 'string' || typeof payload.productId !== 'string') return;

        const tc = this.config.categories.find(c => c.id === payload.categoryId);
        if (!tc) return;

        const tp = tc.products.find(p => p.id === payload.productId);
        if (!tp) return;

        tp.inStock = !tp.inStock;
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'reorder': {
        if (!(await this.canModifyConfig(conn))) return;
        const payload = msg.payload;
        if (!this.isValidReorder(payload)) return;

        if (payload.type === 'categories') {
          // Reassign order field based on new array index, then sort.
          payload.ids.forEach((id: string, index: number) => {
            const cat = this.config.categories.find(c => c.id === id);
            if (cat) cat.order = index;
          });
          this.config.categories.sort((a, b) => a.order - b.order);
        } else {
          // payload.type === 'products'
          const cat = this.config.categories.find(c => c.id === payload.categoryId);
          if (!cat) return;
          // Product has no `order` field (see src/types.ts), so array index is
          // the single source of truth for product ordering. Rebuild the
          // products array in the requested id order.
          const byId = new Map(cat.products.map(p => [p.id, p]));
          const reordered = payload.ids
            .map((id: string) => byId.get(id))
            .filter((p: any): p is NonNullable<typeof p> => Boolean(p));
          cat.products = reordered;
        }

        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }
    }
  }

  private isValidConfigUpdate(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;
    
    const allowedKeys = ['dispensaryName', 'logo', 'primaryColor', 'secondaryColor', 
                         'showStrain', 'showLogo', 'showDescription', 'showImages',
                         'showBrand', 'showPromos', 'currency', 'customFont', 'layout',
                         'layoutMode', 'fontSize', 'theme', 'autoScroll', 'autoScrollSpeed', 'showCategory',
                         'promoBanner', 'scheduledBanners', 'ageVerified', 'disclaimer', 'complianceState', 'analyticsEnabled', 'template',
                         'displayCount'];
    
    for (const key of Object.keys(payload)) {
      if (!allowedKeys.includes(key)) return false;
    }
    
    if (payload.dispensaryName !== undefined && typeof payload.dispensaryName !== 'string') return false;
    if (payload.logo !== undefined && typeof payload.logo !== 'string') return false;
    if (payload.primaryColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(payload.primaryColor)) return false;
    if (payload.secondaryColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(payload.secondaryColor)) return false;
    if (payload.currency !== undefined && typeof payload.currency !== 'string') return false;
    if (payload.customFont !== undefined && typeof payload.customFont !== 'string') return false;
    if (payload.layout !== undefined && !['grid', 'list', 'cards', 'compact'].includes(payload.layout)) return false;
    if (payload.fontSize !== undefined && !['small', 'medium', 'large'].includes(payload.fontSize)) return false;
    if (payload.theme !== undefined && !['dark', 'light'].includes(payload.theme)) return false;
    if (payload.template !== undefined && !['default', 'minimal', 'neon', 'light', 'sunset', 'forest', 'royal', 'gold', 'ocean', 'crimson', 'bone', 'vapor'].includes(payload.template)) return false;
    if (payload.layoutMode !== undefined && !['auto', 'columns', 'pricelist', 'compact', 'grid'].includes(payload.layoutMode)) return false;
    if (payload.displayCount !== undefined && (typeof payload.displayCount !== 'number' || payload.displayCount < 1 || payload.displayCount > 4)) return false;
    if (payload.autoScrollSpeed !== undefined && (typeof payload.autoScrollSpeed !== 'number' || payload.autoScrollSpeed < 1 || payload.autoScrollSpeed > 200)) return false;
    if (payload.showCategory !== undefined && payload.showCategory !== null && typeof payload.showCategory !== 'string') return false;
    if (payload.promoBanner !== undefined && (typeof payload.promoBanner !== 'object' || !payload.promoBanner)) return false;
    if (payload.disclaimer !== undefined && typeof payload.disclaimer !== 'string') return false;
    if (payload.complianceState !== undefined && payload.complianceState !== '' && this.sanitizeComplianceState(payload.complianceState) === undefined) return false;
    
    return true;
  }

  private isValidCategoryAdd(payload: any): boolean {
    return payload && typeof payload === 'object' && 
           typeof payload.name === 'string' && payload.name.trim().length > 0 &&
           payload.name.trim().length <= 100;
  }

  private isValidCategoryUpdate(payload: any): boolean {
    return payload && typeof payload === 'object' && 
           typeof payload.categoryId === 'string' &&
           payload.updates && typeof payload.updates === 'object' &&
           (payload.updates.name === undefined || 
            (typeof payload.updates.name === 'string' && payload.updates.name.trim().length <= 100)) &&
           (payload.updates.order === undefined || typeof payload.updates.order === 'number');
  }

  private isValidProductAdd(payload: any): boolean {
    return payload && typeof payload === 'object' && 
           typeof payload.categoryId === 'string' &&
           payload.product && typeof payload.product === 'object' &&
           typeof payload.product.name === 'string' && payload.product.name.trim().length > 0 &&
           payload.product.name.trim().length <= 100 &&
           typeof payload.product.price === 'number' && !isNaN(payload.product.price) &&
           payload.product.price >= 0 && payload.product.price <= 1000000;
  }

  private isValidProductUpdate(payload: any): boolean {
    return payload && typeof payload === 'object' && 
           typeof payload.categoryId === 'string' &&
           typeof payload.productId === 'string' &&
           payload.updates && typeof payload.updates === 'object';
  }

  // Validate a batch reorder payload.
  //   { type: 'categories', ids: string[] }
  //   { type: 'products', categoryId: string, ids: string[] }
  // `ids` must be a non-empty array of unique strings whose set exactly
  // matches the existing items of the target scope. This rejects unknown
  // ids, partial lists, and duplicate ids atomically.
  private isValidReorder(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.type !== 'categories' && payload.type !== 'products') return false;
    if (payload.type === 'products' && typeof payload.categoryId !== 'string') return false;
    if (!Array.isArray(payload.ids)) return false;
    // Every id must be a string.
    if (!payload.ids.every((id: any) => typeof id === 'string' && id.length > 0 && id.length <= 120)) return false;
    // No duplicate ids allowed.
    const seen = new Set<string>();
    for (const id of payload.ids as string[]) {
      if (seen.has(id)) return false;
      seen.add(id);
    }

    if (payload.type === 'categories') {
      const existing = new Set(this.config.categories.map(c => c.id));
      if (payload.ids.length !== existing.size) return false;
      if (!(payload.ids as string[]).every((id: string) => existing.has(id))) return false;
      return true;
    }

    const cat = this.config.categories.find(c => c.id === payload.categoryId);
    if (!cat) return false;
    const existingProducts = new Set(cat.products.map(p => p.id));
    if (payload.ids.length !== existingProducts.size) return false;
    if (!(payload.ids as string[]).every((id: string) => existingProducts.has(id))) return false;
    return true;
  }

  private isValidImportedCategories(categories: any): boolean {
    if (!Array.isArray(categories) || categories.length < 1 || categories.length > 20) return false;
    return categories.every((cat) => (
      cat && typeof cat === 'object' &&
      typeof cat.name === 'string' && cat.name.trim().length > 0 &&
      Array.isArray(cat.products) && cat.products.length <= 500 &&
      cat.products.every((p: any) => p && typeof p === 'object' && typeof p.name === 'string' && typeof p.price === 'number')
    ));
  }

  private sanitizeCategories(categories: any[]) {
    return categories.slice(0, 20).map((cat, index) => ({
      id: typeof cat.id === 'string' ? this.sanitizeString(cat.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) : `cat-${index}`,
      name: this.sanitizeString(cat.name),
      order: typeof cat.order === 'number' ? Math.max(0, Math.floor(cat.order)) : index,
      products: (cat.products || []).slice(0, 500).map((p: any, pIndex: number) => ({
        id: typeof p.id === 'string' ? this.sanitizeString(p.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) : `prod-${index}-${pIndex}`,
        name: this.sanitizeString(p.name),
        price: this.sanitizePrice(p.price),
        originalPrice: typeof p.originalPrice === 'number' ? this.sanitizePrice(p.originalPrice) : undefined,
        thc: typeof p.thc === 'string' ? this.sanitizeString(p.thc) : undefined,
        cbd: typeof p.cbd === 'string' ? this.sanitizeString(p.cbd) : undefined,
        description: typeof p.description === 'string' ? this.sanitizeString(p.description) : undefined,
        image: typeof p.image === 'string' ? this.sanitizeString(p.image) : undefined,
        weight: typeof p.weight === 'string' ? this.sanitizeString(p.weight) : undefined,
        brand: typeof p.brand === 'string' ? this.sanitizeString(p.brand) : undefined,
        inStock: p.inStock !== false,
        strain: ['indica', 'sativa', 'hybrid'].includes(p.strain) ? p.strain : undefined,
        isPromo: Boolean(p.isPromo),
        priceTiers: this.sanitizePriceTiers(p.priceTiers),
      })),
    })).sort((a, b) => a.order - b.order);
  }

  private sanitizeString(str: string): string {
    return str.trim().slice(0, 500);
  }

  private sanitizePrice(price: number): number {
    return Math.max(0, Math.min(1000000, Math.round(price * 100) / 100));
  }

  private sanitizePriceTiers(tiers: any): { label: string; price: string }[] | undefined {
    if (!Array.isArray(tiers)) return undefined;
    const out: { label: string; price: string }[] = [];
    for (const t of tiers) {
      if (!t || typeof t !== 'object') continue;
      const label = typeof t.label === 'string' ? t.label.trim().slice(0, 20) : '';
      const price = typeof t.price === 'string' ? t.price.trim().slice(0, 20) : '';
      if (!label || !price) continue;
      out.push({ label, price });
      if (out.length >= 6) break;
    }
    return out.length > 0 ? out : undefined;
  }

  private sanitizeComplianceState(value: any): string | undefined {
    if (typeof value !== 'string') return undefined;
    const v = value.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(v) ? v : undefined;
  }

  private async canModifyConfig(conn: WSConnection): Promise<boolean> {
    if (conn.role !== 'phone') return false;
    if (!conn.accountId) return false;
    // A session must be explicitly claimed by its creator before any
    // config mutation is allowed. The owner is set via POST /owner
    // (called by index.ts when a user visits /config/<id> or imports).
    // We never auto-claim on first write — that created a race where
    // the first authenticated phone to connect stole any unowned session.
    if (!this.ownerAccountId) return false;
    if (this.ownerAccountId !== conn.accountId) return false;
    if (!this.env.ACCOUNTS) return false;
    const account = await getAccount(this.env as any, conn.accountId);
    if (!account) return false;
    return isSubscriptionActive(account);
  }

  private broadcast(msg: WSMessage, excludeId?: string) {
    const data = JSON.stringify(msg);
    const deadConnections: string[] = [];
    
    for (const [id, conn] of this.connections) {
      if (id !== excludeId) {
        try {
          conn.socket.send(data);
        } catch (err) {
          deadConnections.push(id);
        }
      }
    }
    
    // Clean up failed connections
    for (const id of deadConnections) {
      this.cleanupConnection(id);
    }
  }
}
