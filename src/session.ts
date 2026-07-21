import {
  DEFAULT_CONFIG,
  TV_FONT_SCALE_MAX,
  TV_FONT_SCALE_MIN,
  TV_PAGE_DURATION_OPTIONS,
  TV_PAGE_TRANSITIONS,
  TV_SCROLL_SPEED_MAX,
  TV_SCROLL_SPEED_MIN,
  normalizeTvPageDurationSeconds,
  normalizeTvFontScale,
  normalizeTvPageTransition,
  normalizeTvScrollSpeed,
  type Category,
  type MenuConfig,
  type MenuSpecial,
  type PriceTier,
  type Product,
  type ReferenceStyleProfile,
  type ScreenConfig,
} from './types';
import { getCookieValue, verifyToken, isSubscriptionActive, getAccount, resolveBusinessAccount, jsonResponse, type Account, type Env as AuthEnv } from './auth';

export type Env = AuthEnv;

interface WSConnection {
  socket: WebSocket;
  role: 'tv' | 'phone';
  id: string;
  lastPong: number;
  accountId?: string;
  displayNumber?: number;
  isEmbed?: boolean;
}

interface StoredSession {
  config: MenuConfig;
  ownerAccountId?: string;
  categoryChunkKeys?: string[];
}

interface DisplayReservation {
  id: string;
  displayNumber: number;
  expiresAt: number;
}

interface DisplayPairingTarget {
  connectionId: string;
  expiresAt: number;
}

interface StoredCategoryChunk {
  categoryIndex: number;
  category: Category;
}

interface ImportJobStatus {
  id: string;
  status: 'queued' | 'running' | 'success' | 'error';
  stage: number;
  progress: number;
  message: string;
  sourceUrl: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  productCount?: number;
  categoryCount?: number;
  photoCount?: number;
  source?: string;
  categories?: Array<{ name: string; count: number }>;
  warnings?: string[];
  debug?: string[];
  error?: string;
  styleProfile?: unknown;
}

interface WSMessage {
  type: string;
  payload?: unknown;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type CategoryAddPayload = { name: string; order?: number };
type CategoryUpdatePayload = { categoryId: string; updates: UnknownRecord };
type ProductAddPayload = { categoryId: string; product: UnknownRecord & { name: string; price: number } };
type ProductUpdatePayload = { categoryId: string; productId: string; updates: UnknownRecord };
type ReorderPayload =
  | { type: 'categories'; ids: string[] }
  | { type: 'products'; categoryId: string; ids: string[] };


// Security and rate limiting constants
const MAX_MESSAGE_SIZE = 65536; // 64KB
const MAX_CONNECTIONS = 50;
const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 90000;
const MESSAGE_RATE_LIMIT = 30; // messages per 10 seconds per connection
const RATE_LIMIT_WINDOW_MS = 10000;
const CATEGORY_CHUNK_TARGET_BYTES = 80 * 1024;
const STORAGE_BATCH_SIZE = 64;
const DISPLAY_PAIRING_TARGET_TTL_MS = 2 * 60 * 1000;
const DISPLAY_RESERVATION_TTL_MS = 30 * 1000;
const DISPLAY_RESERVATIONS_STORAGE_KEY = 'displayReservations';

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
  private messageQueue: Promise<void> = Promise.resolve();
  private persistedCategoryChunkKeys: string[] = [];
  private persistedCategoriesJson: string | null = null;
  private persistedConfigSnapshot: MenuConfig;
  private persistedOwnerAccountId?: string;
  private categoryCleanupPending = true;
  private displayPairingTargets: Map<string, DisplayPairingTarget> = new Map();

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
    this.persistedConfigSnapshot = structuredClone(cloned);
  }

  private normalizeStoredConfig(config: MenuConfig): MenuConfig {
    const legacyConfig = config as MenuConfig & { autoScrollSpeed?: unknown };
    const categories = this.sanitizeCategories(config.categories);
    const displayCount = this.sanitizeDisplayCount(config.displayCount) ?? DEFAULT_CONFIG.displayCount;
    const normalized = {
      ...structuredClone(DEFAULT_CONFIG),
      ...config,
      categories,
      displayCount,
      screens: this.sanitizeScreens(config.screens, categories),
      fontScale: normalizeTvFontScale(config.fontScale, config.fontSize),
      pageDurationSeconds: normalizeTvPageDurationSeconds(config.pageDurationSeconds, legacyConfig.autoScrollSpeed),
      smoothScrollSpeed: normalizeTvScrollSpeed(config.smoothScrollSpeed),
      pageTransition: normalizeTvPageTransition(config.pageTransition),
    };
    delete (normalized as MenuConfig & { autoScrollSpeed?: unknown }).autoScrollSpeed;
    return normalized;
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
            if (stored.ownerAccountId) {
              this.ownerAccountId = stored.ownerAccountId;
            }
            let storedConfig = stored.config;
            const chunkKeys = Array.isArray(stored.categoryChunkKeys)
              ? stored.categoryChunkKeys.filter((key): key is string => typeof key === 'string')
              : [];
            if (chunkKeys.length > 0) {
              storedConfig = {
                ...storedConfig,
                categories: await this.loadCategoryChunks(chunkKeys),
              };
            }
            if (typeof storedConfig.fontScale === 'number' && Number.isFinite(storedConfig.fontScale)) {
              storedConfig = {
                ...storedConfig,
                fontScale: normalizeTvFontScale(storedConfig.fontScale, storedConfig.fontSize),
              };
            }
            if (this.isValidConfig(storedConfig)) {
              this.config = this.normalizeStoredConfig(storedConfig);
              this.persistedCategoryChunkKeys = chunkKeys;
              this.persistedCategoriesJson = JSON.stringify(this.config.categories);
            }
          }
        } catch (err) {
          console.error('Failed to load persisted config:', err);
        }
        this.persistedConfigSnapshot = structuredClone(this.config);
        this.persistedOwnerAccountId = this.ownerAccountId;
        await this.cleanupInactiveCategoryChunks(this.persistedCategoryChunkKeys);
        this.initialized = true;
      });
    }
    await this.initializePromise;
  }

  private async persistConfig(): Promise<void> {
    this.config = { ...this.config, updatedAt: new Date().toISOString() };
    const categoriesJson = JSON.stringify(this.config.categories);
    const hasPersistedCategoryStorage = this.config.categories.length === 0 || this.persistedCategoryChunkKeys.length > 0;
    const categoriesChanged = categoriesJson !== this.persistedCategoriesJson || !hasPersistedCategoryStorage;
    let nextChunkKeys = this.persistedCategoryChunkKeys;

    try {
      if (categoriesChanged) {
        const version = crypto.randomUUID();
        const chunks = this.buildCategoryChunks(this.config.categories);
        const entries: Array<[string, StoredCategoryChunk]> = chunks.map((chunk, index) => [
          `category:${version}:${index}`,
          chunk,
        ]);
        nextChunkKeys = entries.map(([key]) => key);
        for (let index = 0; index < entries.length; index += STORAGE_BATCH_SIZE) {
          await this.state.storage.put(Object.fromEntries(entries.slice(index, index + STORAGE_BATCH_SIZE)));
        }
      }

      const stored: StoredSession = {
        config: { ...this.config, categories: [] },
        categoryChunkKeys: nextChunkKeys,
      };
      if (this.ownerAccountId) stored.ownerAccountId = this.ownerAccountId;
      await this.state.storage.put('session', stored);

      this.persistedCategoryChunkKeys = nextChunkKeys;
      this.persistedCategoriesJson = categoriesJson;
      this.persistedConfigSnapshot = structuredClone(this.config);
      this.persistedOwnerAccountId = this.ownerAccountId;
      if (categoriesChanged) this.categoryCleanupPending = true;
      if (this.categoryCleanupPending) {
        await this.cleanupInactiveCategoryChunks(nextChunkKeys);
      }
    } catch (err) {
      this.categoryCleanupPending = true;
      await this.cleanupInactiveCategoryChunks(this.persistedCategoryChunkKeys);
      this.config = structuredClone(this.persistedConfigSnapshot);
      this.ownerAccountId = this.persistedOwnerAccountId;
      throw err;
    }
  }

  private buildCategoryChunks(categories: Category[]): StoredCategoryChunk[] {
    const encoder = new TextEncoder();
    const chunks: StoredCategoryChunk[] = [];
    categories.forEach((category, categoryIndex) => {
      const categoryBase = { ...category, products: [] };
      let products: Product[] = [];
      let byteLength = encoder.encode(JSON.stringify({ categoryIndex, category: categoryBase })).byteLength;
      const flush = () => {
        chunks.push({
          categoryIndex,
          category: { ...categoryBase, products },
        });
        products = [];
        byteLength = encoder.encode(JSON.stringify({ categoryIndex, category: categoryBase })).byteLength;
      };

      for (const product of category.products) {
        const productBytes = encoder.encode(JSON.stringify(product)).byteLength + 1;
        if (products.length > 0 && byteLength + productBytes > CATEGORY_CHUNK_TARGET_BYTES) flush();
        products.push(product);
        byteLength += productBytes;
      }
      flush();
    });
    return chunks;
  }

  private async loadCategoryChunks(keys: string[]): Promise<Category[]> {
    const chunks: StoredCategoryChunk[] = [];
    for (let index = 0; index < keys.length; index += STORAGE_BATCH_SIZE) {
      const batchKeys = keys.slice(index, index + STORAGE_BATCH_SIZE);
      const stored = await this.state.storage.get<StoredCategoryChunk>(batchKeys);
      for (const key of batchKeys) {
        const chunk = stored.get(key);
        if (!chunk) throw new Error(`Missing persisted category chunk: ${key}`);
        chunks.push(chunk);
      }
    }

    const categories: Category[] = [];
    for (const chunk of chunks) {
      const existing = categories[chunk.categoryIndex];
      if (existing) {
        existing.products.push(...chunk.category.products);
      } else {
        categories[chunk.categoryIndex] = {
          ...chunk.category,
          products: [...chunk.category.products],
        };
      }
    }
    return categories.filter(Boolean);
  }

  private async cleanupInactiveCategoryChunks(activeKeys: string[]): Promise<void> {
    try {
      const stored = await this.state.storage.list<StoredCategoryChunk>({ prefix: 'category:' });
      const active = new Set(activeKeys);
      const staleKeys = [...stored.keys()].filter((key) => !active.has(key));
      this.categoryCleanupPending = !(await this.deleteStorageKeys(staleKeys));
    } catch (err) {
      this.categoryCleanupPending = true;
      console.error('Failed to clean up stale category chunks:', err);
    }
  }

  private async deleteStorageKeys(keys: string[]): Promise<boolean> {
    let deleted = true;
    for (let index = 0; index < keys.length; index += STORAGE_BATCH_SIZE) {
      try {
        await this.state.storage.delete(keys.slice(index, index + STORAGE_BATCH_SIZE));
      } catch (err) {
        deleted = false;
        console.error('Failed to delete stale category chunks:', err);
      }
    }
    return deleted;
  }

  private isValidConfig(config: unknown): config is MenuConfig {
    if (!isRecord(config)) return false;
    return (
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
      this.sanitizeLayout(config.layout) !== undefined &&
      this.sanitizeLayoutMode(config.layoutMode) !== undefined &&
      this.sanitizeFontSize(config.fontSize) !== undefined &&
      (config.fontScale === undefined || this.sanitizeFontScale(config.fontScale) !== undefined) &&
      this.sanitizeTheme(config.theme) !== undefined &&
      (config.pageDurationSeconds === undefined || this.sanitizePageDurationSeconds(config.pageDurationSeconds) !== undefined) &&
      (config.smoothProductScroll === undefined || typeof config.smoothProductScroll === 'boolean') &&
      (config.smoothScrollSpeed === undefined || this.sanitizeScrollSpeed(config.smoothScrollSpeed) !== undefined) &&
      (config.pageTransition === undefined || this.sanitizePageTransition(config.pageTransition) !== undefined) &&
      ['default', 'minimal', 'neon', 'light', 'sunset', 'forest', 'royal', 'gold', 'ocean', 'crimson', 'bone', 'vapor'].includes(String(config.template)) &&
      typeof config.displayCount === 'number' &&
      (config.screens === undefined || Array.isArray(config.screens))
    );
  }

  private isValidImportJobStatus(job: unknown): job is ImportJobStatus {
    if (!isRecord(job)) return false;
    const status = job.status;
    if (status !== 'queued' && status !== 'running' && status !== 'success' && status !== 'error') return false;
    if (typeof job.id !== 'string' || job.id.length < 8 || job.id.length > 80) return false;
    if (typeof job.message !== 'string' || typeof job.sourceUrl !== 'string') return false;
    if (typeof job.startedAt !== 'string' || typeof job.updatedAt !== 'string') return false;
    if (typeof job.stage !== 'number' || typeof job.progress !== 'number') return false;
    if (job.progress < 0 || job.progress > 100) return false;
    return true;
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
        return this.handleWebSocket(request, role || 'tv', token.accountId);
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

    if (url.pathname === '/import-job') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      if (!accountId) return jsonResponse({ error: 'Missing account' }, 400);
      const businessOwner = await this.getAuthorizedBusinessOwner(accountId);
      if (!businessOwner || (this.ownerAccountId && this.ownerAccountId !== businessOwner.id)) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }

      if (request.method === 'GET') {
        const job = await this.state.storage.get<ImportJobStatus>('importJob');
        if (!job) return jsonResponse({ error: 'No import job found' }, 404);
        return jsonResponse({ job });
      }

      if (request.method === 'POST') {
        const data: unknown = await request.json();
        if (!this.isValidImportJobStatus(data)) {
          return jsonResponse({ error: 'Invalid import job status' }, 400);
        }
        if (!this.ownerAccountId) {
          this.ownerAccountId = businessOwner.id;
          await this.persistConfig();
        }
        await this.state.storage.put('importJob', data);
        this.broadcast({ type: 'import_job', payload: data });
        return jsonResponse({ ok: true });
      }

      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Internal import endpoint used by the Worker after Dutchie scrape.
    if (url.pathname === '/import' && request.method === 'POST') {
      try {
        const accountId = request.headers.get('X-Account-Id') || undefined;
        if (!accountId) {
          return new Response(JSON.stringify({ ok: false, error: 'Owner required' }), { status: 403 });
        }
        const businessOwner = await this.getAuthorizedBusinessOwner(accountId);
        if (!businessOwner || (this.ownerAccountId && this.ownerAccountId !== businessOwner.id)) {
          return new Response(JSON.stringify({ ok: false, error: 'Not authorized for this business' }), { status: 403 });
        }
        const data: unknown = await request.json();
        if (!isRecord(data) || !this.isValidImportedCategories(data.categories) || data.categories.length < 1) {
          return new Response(JSON.stringify({ ok: false, error: 'Invalid imported categories' }), { status: 400 });
        }

        const hasExistingCatalog = this.config.categories.some((category) => category.products.length > 0);
        const applyPresentation = data.presentationDefaults !== true || !hasExistingCatalog;
        const presentationUpdate: Partial<MenuConfig> = applyPresentation ? {
          layout: this.sanitizeLayout(data.layout) ?? this.config.layout,
          layoutMode: this.sanitizeLayoutMode(data.layoutMode) ?? this.config.layoutMode,
          fontSize: this.sanitizeFontSize(data.fontSize) ?? this.config.fontSize,
          fontScale: this.normalizeImportedFontScale(data.fontScale, data.fontSize)
            ?? this.fontScaleForFontSize(data.fontSize)
            ?? this.config.fontScale,
          theme: this.sanitizeTheme(data.theme) ?? this.config.theme,
          template: this.sanitizeTemplate(data.template) ?? this.config.template,
          primaryColor: this.sanitizeHexColor(data.primaryColor) ?? this.config.primaryColor,
          secondaryColor: this.sanitizeHexColor(data.secondaryColor) ?? this.config.secondaryColor,
          autoScroll: typeof data.autoScroll === 'boolean' ? data.autoScroll : this.config.autoScroll,
          smoothProductScroll: typeof data.smoothProductScroll === 'boolean' ? data.smoothProductScroll : this.config.smoothProductScroll,
          pageDurationSeconds: this.sanitizePageDurationSeconds(data.pageDurationSeconds) ?? (
            data.autoScrollSpeed === undefined
              ? this.config.pageDurationSeconds
              : normalizeTvPageDurationSeconds(undefined, data.autoScrollSpeed)
          ),
          smoothScrollSpeed: this.sanitizeScrollSpeed(data.smoothScrollSpeed) ?? this.config.smoothScrollSpeed,
          pageTransition: this.sanitizePageTransition(data.pageTransition) ?? this.config.pageTransition,
          showImages: typeof data.showImages === 'boolean' ? data.showImages : this.config.showImages,
          showLogo: typeof data.showLogo === 'boolean' ? data.showLogo : this.config.showLogo,
          showBrand: typeof data.showBrand === 'boolean' ? data.showBrand : this.config.showBrand,
          showStrain: typeof data.showStrain === 'boolean' ? data.showStrain : this.config.showStrain,
          showPromos: typeof data.showPromos === 'boolean' ? data.showPromos : this.config.showPromos,
          showDescription: typeof data.showDescription === 'boolean' ? data.showDescription : this.config.showDescription,
          styleProfile: this.sanitizeStyleProfile(data.styleProfile) ?? this.config.styleProfile,
          tvDemo: typeof data.tvDemo === 'boolean' ? data.tvDemo : this.config.tvDemo,
        } : {};

        const categories = this.sanitizeCategories(data.categories);
        const displayCount = this.sanitizeDisplayCount(data.displayCount) ?? this.config.displayCount;
        this.config = {
          ...this.config,
          dispensaryName: typeof data.dispensaryName === 'string' ? this.sanitizeString(data.dispensaryName) : this.config.dispensaryName,
          logo: typeof data.logo === 'string' ? this.sanitizeString(data.logo) : this.config.logo,
          categories,
          displayCount,
          screens: this.sanitizeScreens(this.config.screens, categories),
          ...presentationUpdate,
        };
        if (!this.ownerAccountId) {
          this.ownerAccountId = businessOwner.id;
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

    // Internal endpoint to set/check the business owner. The authenticated
    // account may be the owner or an accepted manager; the durable session is
    // always claimed to the owner account so every business member sees the
    // same persistent menu.
    if (url.pathname === '/owner' && request.method === 'POST') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      if (!accountId) return new Response('Missing account', { status: 400 });
      const businessOwner = await this.getAuthorizedBusinessOwner(accountId);
      if (!businessOwner) return new Response('Forbidden', { status: 403 });
      if (this.ownerAccountId && this.ownerAccountId !== businessOwner.id) {
        return new Response(JSON.stringify({ owned: true }), { status: 403 });
      }
      if (!this.ownerAccountId) {
        this.ownerAccountId = businessOwner.id;
        await this.persistConfig();
      }
      return new Response(JSON.stringify({ ownerAccountId: this.ownerAccountId }));
    }

    if (url.pathname === '/display-status' && request.method === 'GET') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      const businessOwner = accountId ? await this.getAuthorizedBusinessOwner(accountId) : null;
      if (!businessOwner || !this.ownerAccountId || this.ownerAccountId !== businessOwner.id) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      const occupiedDisplays = this.getActivePhysicalDisplays();
      for (const reservation of await this.loadDisplayReservations()) {
        occupiedDisplays.add(reservation.displayNumber);
      }
      return jsonResponse({
        displayCount: this.config.displayCount,
        activeDisplays: Array.from(occupiedDisplays).sort((a, b) => a - b),
      });
    }

    if (url.pathname === '/pairing-target' && request.method === 'POST') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      const businessOwner = accountId ? await this.getAuthorizedBusinessOwner(accountId) : null;
      if (
        !businessOwner
        || !isSubscriptionActive(businessOwner)
        || !this.ownerAccountId
        || this.ownerAccountId !== businessOwner.id
      ) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      const waitingTvs = this.getWaitingPhysicalTvs();
      if (waitingTvs.length !== 1) {
        return jsonResponse({ error: 'Expected exactly one waiting TV' }, 409);
      }
      const assignmentToken = crypto.randomUUID();
      this.displayPairingTargets.clear();
      this.displayPairingTargets.set(assignmentToken, {
        connectionId: waitingTvs[0].id,
        expiresAt: Date.now() + DISPLAY_PAIRING_TARGET_TTL_MS,
      });
      return jsonResponse({ assignmentToken });
    }

    if (url.pathname === '/pair-display' && request.method === 'POST') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      const businessOwner = accountId ? await this.getAuthorizedBusinessOwner(accountId) : null;
      if (
        !businessOwner
        || !isSubscriptionActive(businessOwner)
        || !this.ownerAccountId
        || this.ownerAccountId !== businessOwner.id
      ) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      const data: unknown = await request.json();
      const scannedSession = isRecord(data) && typeof data.scannedSession === 'string' ? data.scannedSession : '';
      const assignmentToken = isRecord(data) && typeof data.assignmentToken === 'string' ? data.assignmentToken : '';
      const displayCount = isRecord(data) ? this.sanitizeDisplayCount(data.displayCount) : undefined;
      const displayNumber = isRecord(data) ? this.sanitizeDisplayCount(data.displayNumber) : undefined;
      if (
        !SESSION_ID_REGEX.test(scannedSession)
        || !SESSION_ID_REGEX.test(assignmentToken)
        || displayCount === undefined
        || displayNumber === undefined
        || displayNumber > displayCount
      ) {
        return jsonResponse({ error: 'Invalid display assignment' }, 400);
      }

      return this.state.blockConcurrencyWhile(async () => {
        const reservations = await this.loadDisplayReservations();
        const occupiedDisplays = this.getActivePhysicalDisplays();
        for (const reservation of reservations) occupiedDisplays.add(reservation.displayNumber);
        if (occupiedDisplays.has(displayNumber)) {
          return jsonResponse({ error: `Display ${displayNumber} is already connected` }, 409);
        }
        const highestOccupiedDisplay = Array.from(occupiedDisplays).reduce(
          (highest, occupiedDisplay) => Math.max(highest, occupiedDisplay),
          1
        );
        if (displayCount < highestOccupiedDisplay) {
          return jsonResponse({
            error: `Disconnect Display ${highestOccupiedDisplay} before reducing the display count`,
          }, 409);
        }

        const reservation: DisplayReservation = {
          id: crypto.randomUUID(),
          displayNumber,
          expiresAt: Date.now() + DISPLAY_RESERVATION_TTL_MS,
        };
        const previousDisplayCount = this.config.displayCount;
        await this.saveDisplayReservations([...reservations, reservation]);
        try {
          this.config.displayCount = displayCount;
          await this.persistConfig();
          this.broadcast({ type: 'config', payload: this.config });
          const scanned = this.env.SESSION.get(this.env.SESSION.idFromName(scannedSession));
          const assignmentResponse = await scanned.fetch(new Request('https://internal/assign-display', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Account-Id': accountId },
            body: JSON.stringify({
              targetSession: businessOwner.businessMenuSessionId,
              assignmentToken,
              displayNumber,
              displayCount,
            }),
          }));
          if (assignmentResponse.ok) {
            return jsonResponse({ ok: true, displayNumber, displayCount });
          }
        } catch {
          // Rollback below keeps a failed assignment from mutating saved setup.
        }

        this.config.displayCount = previousDisplayCount;
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        await this.saveDisplayReservations(reservations);
        return jsonResponse({ error: 'The scanned TV is no longer connected' }, 409);
      });
    }

    if (url.pathname === '/assign-display' && request.method === 'POST') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      const businessOwner = accountId ? await this.getAuthorizedBusinessOwner(accountId) : null;
      if (
        !businessOwner
        || !isSubscriptionActive(businessOwner)
        || !this.ownerAccountId
        || this.ownerAccountId !== businessOwner.id
      ) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      const data: unknown = await request.json();
      const targetSession = isRecord(data) && typeof data.targetSession === 'string' ? data.targetSession : '';
      const assignmentToken = isRecord(data) && typeof data.assignmentToken === 'string' ? data.assignmentToken : '';
      const displayCount = isRecord(data) ? this.sanitizeDisplayCount(data.displayCount) : undefined;
      const displayNumber = isRecord(data) ? this.sanitizeDisplayCount(data.displayNumber) : undefined;
      if (
        !SESSION_ID_REGEX.test(targetSession)
        || targetSession !== businessOwner.businessMenuSessionId
        || !SESSION_ID_REGEX.test(assignmentToken)
        || displayCount === undefined
        || displayNumber === undefined
        || displayNumber > displayCount
      ) {
        return jsonResponse({ error: 'Invalid display assignment' }, 400);
      }
      this.pruneDisplayPairingTargets();
      const pairingTarget = this.displayPairingTargets.get(assignmentToken);
      const targetConnection = pairingTarget
        ? this.connections.get(pairingTarget.connectionId)
        : undefined;
      if (!targetConnection || targetConnection.role !== 'tv' || targetConnection.isEmbed) {
        this.displayPairingTargets.delete(assignmentToken);
        return jsonResponse({ error: 'The scanned TV is no longer connected' }, 409);
      }
      const assignmentUrl = `/tv/${encodeURIComponent(targetSession)}?display=${displayNumber}&displays=${displayCount}`;
      try {
        targetConnection.socket.send(JSON.stringify({
          type: 'display_assignment',
          payload: { url: assignmentUrl },
        }));
      } catch {
        this.cleanupConnection(targetConnection.id);
        this.displayPairingTargets.delete(assignmentToken);
        return jsonResponse({ error: 'The scanned TV is no longer connected' }, 409);
      }
      this.displayPairingTargets.delete(assignmentToken);
      return jsonResponse({ ok: true, url: assignmentUrl });
    }

    // Internal endpoint to export config (business members only)
    if (url.pathname === '/config' && request.method === 'GET') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      if (!accountId) return new Response('Missing account', { status: 400 });
      const businessOwner = await this.getAuthorizedBusinessOwner(accountId);
      if (!businessOwner || (this.ownerAccountId && this.ownerAccountId !== businessOwner.id)) {
        return new Response('Forbidden', { status: 403 });
      }
      return jsonResponse({ config: this.config });
    }

    // Public endpoint for TV initial render (no auth required, full config
    // for owned sessions; unowned sessions get the default config with empty
    // categories so the TV stays in pairing mode).
    if (url.pathname === '/tv-config' && request.method === 'GET') {
      if (!this.ownerAccountId) {
        return jsonResponse({
          ...DEFAULT_CONFIG,
          categories: [],
        });
      }
      return jsonResponse(this.config);
    }

    // Public endpoint for embeddable widget (no auth required, read-only menu data).
    // Unowned sessions must not expose a fake/sample menu as a usable menu.
    if (url.pathname === '/widget' && request.method === 'GET') {
      if (!this.ownerAccountId) {
      return jsonResponse({
        dispensaryName: DEFAULT_CONFIG.dispensaryName,
        categories: [],
        layout: this.config.layout,
        layoutMode: this.config.layoutMode,
        fontSize: this.config.fontSize,
        fontScale: this.config.fontScale,
        theme: this.config.theme,
        template: this.config.template,
        primaryColor: this.config.primaryColor,
        secondaryColor: this.config.secondaryColor,
        promoBanner: this.config.promoBanner,
        scheduledBanners: this.config.scheduledBanners,
        logo: this.config.logo,
        showCategory: this.config.showCategory,
        disclaimer: this.config.disclaimer,
        complianceState: this.config.complianceState,
        currency: this.config.currency,
        autoScroll: this.config.autoScroll,
        pageDurationSeconds: this.config.pageDurationSeconds,
        pageTransition: this.config.pageTransition,
        displayCount: this.config.displayCount,
        updatedAt: this.config.updatedAt,
      });
      }
      return jsonResponse({
        dispensaryName: this.config.dispensaryName,
        categories: this.config.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          order: cat.order,
          products: cat.products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            originalPrice: p.originalPrice,
            thc: p.thc,
            cbd: p.cbd,
            weight: p.weight,
            brand: p.brand,
            sku: p.sku,
            strain: p.strain,
            inStock: p.inStock,
            isPromo: p.isPromo,
            specialLabel: p.specialLabel,
            image: p.image,
            priceTiers: p.priceTiers,
          })),
        })),
        layout: this.config.layout,
        layoutMode: this.config.layoutMode,
        fontSize: this.config.fontSize,
        fontScale: this.config.fontScale,
        theme: this.config.theme,
        template: this.config.template,
        primaryColor: this.config.primaryColor,
        secondaryColor: this.config.secondaryColor,
        promoBanner: this.config.promoBanner,
        scheduledBanners: this.config.scheduledBanners,
        logo: this.config.logo,
        showCategory: this.config.showCategory,
        disclaimer: this.config.disclaimer,
        complianceState: this.config.complianceState,
        currency: this.config.currency,
        autoScroll: this.config.autoScroll,
        pageDurationSeconds: this.config.pageDurationSeconds,
        pageTransition: this.config.pageTransition,
        displayCount: this.config.displayCount,
        updatedAt: this.config.updatedAt,
      });
    }

    // Internal wipe endpoint used by account deletion (GDPR/CCPA cascade).
    // Closes every live WebSocket after notifying peers, then clears all
    // durable storage and in-memory state. Returns 200. The caller is the
    // Worker router, which has already verified the requesting account owns
    // this session before invoking.
    if (url.pathname === '/' && request.method === 'DELETE') {
      const accountId = request.headers.get('X-Account-Id') || undefined;
      const businessOwner = accountId ? await this.getAuthorizedBusinessOwner(accountId) : null;
      if (!accountId || !businessOwner || accountId !== businessOwner.id || !this.ownerAccountId || businessOwner.id !== this.ownerAccountId) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      try {
        this.broadcast({ type: 'session_deleted' });
      } catch {
        // ignore broadcast failures during teardown
      }
      for (const [, conn] of this.connections) {
        try { conn.socket.close(1001, 'Session deleted'); } catch { /* ignore teardown failures */ }
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
      this.persistedCategoryChunkKeys = [];
      this.persistedCategoriesJson = null;
      this.persistedConfigSnapshot = structuredClone(cloned);
      this.persistedOwnerAccountId = undefined;
      this.categoryCleanupPending = false;
      this.initialized = true;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocket(request: Request, role: 'tv' | 'phone', accountId?: string): Response {
    const url = new URL(request.url);
    if (this.connections.size >= MAX_CONNECTIONS) {
      return new Response('Too many connections', { status: 503 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    const connId = crypto.randomUUID();

    const requestedDisplay = Number(url.searchParams.get('display') || '1');
    const displayNumber = role === 'tv' && Number.isInteger(requestedDisplay)
      ? Math.max(1, Math.min(4, requestedDisplay))
      : undefined;
    const isEmbed = role === 'tv' && url.searchParams.get('embed') === '1';
    this.connections.set(connId, {
      socket: server,
      role,
      id: connId,
      lastPong: Date.now(),
      accountId,
      displayNumber,
      isEmbed,
    });

    this.startHeartbeat();

    server.addEventListener('message', (event) => {
      this.messageQueue = this.messageQueue
        .then(() => this.handleWebSocketEvent(event, connId, server))
        .catch((err) => console.error('WS message queue error:', err));
    });

    server.addEventListener('close', () => this.cleanupConnection(connId));
    server.addEventListener('error', () => this.cleanupConnection(connId));

    // Send current config on connect for TV
    if (role === 'tv') {
      server.send(JSON.stringify({ type: 'config', payload: this.config }));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleWebSocketEvent(event: MessageEvent, connId: string, server: WebSocket): Promise<void> {
    try {
      if (typeof event.data !== 'string') {
        server.close(1003, 'Text messages only');
        return;
      }
      if (event.data.length > MAX_MESSAGE_SIZE) {
        server.close(1009, 'Message too large');
        return;
      }
      if (!this.checkRateLimit(connId)) {
        server.close(1008, 'Rate limit exceeded');
        return;
      }
      const parsed: unknown = JSON.parse(event.data);
      if (!isRecord(parsed) || typeof parsed.type !== 'string') return;
      const message: WSMessage = { type: parsed.type, payload: parsed.payload };
      await this.handleMessage(message, connId, server);
    } catch (err) {
      console.error('WS message error:', err);
      try {
        server.send(JSON.stringify({ type: 'error', payload: 'Update failed; your change was not saved.' }));
      } catch {
        // The socket may already be closed; the persistence failure remains logged above.
      }
    }
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
      if (conn.role === 'phone' && !Array.from(this.connections.values()).some((peer) => peer.role === 'phone')) {
        this.broadcast({ type: 'unpaired' }, connId);
      }
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
        if (hasTv && hasPhone) {
          this.broadcast({ type: 'paired' });
          // Push the current menu to every connected screen so the TV shows the
          // latest menu as soon as the phone pairs, without waiting for an edit.
          this.broadcast({ type: 'config', payload: this.config });
        }
        break;
      }

      case 'pong': {
        conn.lastPong = Date.now();
        break;
      }

      case 'config_update': {
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!this.isValidConfigUpdate(payload)) return;
        const sanitizedPayload = { ...payload };
        if (sanitizedPayload.fontScale !== undefined) {
          sanitizedPayload.fontScale = this.sanitizeFontScale(sanitizedPayload.fontScale);
        }
        if (sanitizedPayload.smoothScrollSpeed !== undefined) {
          sanitizedPayload.smoothScrollSpeed = this.sanitizeScrollSpeed(sanitizedPayload.smoothScrollSpeed);
        }
        if (sanitizedPayload.complianceState !== undefined) {
          const cs = this.sanitizeComplianceState(sanitizedPayload.complianceState);
          if (cs) sanitizedPayload.complianceState = cs;
          else if (sanitizedPayload.complianceState === '') sanitizedPayload.complianceState = '';
          else delete sanitizedPayload.complianceState;
        }
        if (sanitizedPayload.specials !== undefined) {
          sanitizedPayload.specials = this.sanitizeSpecials(sanitizedPayload.specials);
        }
        if (sanitizedPayload.styleProfile !== undefined) {
          const profile = this.sanitizeStyleProfile(sanitizedPayload.styleProfile);
          if (profile) sanitizedPayload.styleProfile = profile;
          else delete sanitizedPayload.styleProfile;
        }
        if (sanitizedPayload.screens !== undefined) {
          sanitizedPayload.screens = this.sanitizeScreens(sanitizedPayload.screens, this.config.categories);
        }
        this.config = { ...this.config, ...sanitizedPayload };
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'config_replace': {
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!isRecord(payload) || !this.isValidImportedCategories(payload.categories)) return;
        const categories = this.sanitizeCategories(payload.categories);
        this.config = {
          ...this.config,
          ...payload,
          fontScale: this.normalizeImportedFontScale(payload.fontScale, payload.fontSize) ?? this.config.fontScale,
          autoScroll: typeof payload.autoScroll === 'boolean' ? payload.autoScroll : this.config.autoScroll,
          pageDurationSeconds: this.sanitizePageDurationSeconds(payload.pageDurationSeconds) ?? (
            payload.autoScrollSpeed === undefined
              ? this.config.pageDurationSeconds
              : normalizeTvPageDurationSeconds(undefined, payload.autoScrollSpeed)
          ),
          smoothScrollSpeed: this.sanitizeScrollSpeed(payload.smoothScrollSpeed) ?? this.config.smoothScrollSpeed,
          pageTransition: this.sanitizePageTransition(payload.pageTransition) ?? this.config.pageTransition,
          categories,
          screens: this.sanitizeScreens(payload.screens ?? this.config.screens, categories),
          styleProfile: this.sanitizeStyleProfile(payload.styleProfile),
        };
        delete (this.config as MenuConfig & { autoScrollSpeed?: unknown }).autoScrollSpeed;
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'category_add': {
        if (!(await this.requireModifyPermission(conn, server))) return;
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
        if (!(await this.requireModifyPermission(conn, server))) return;
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
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!isRecord(payload) || typeof payload.categoryId !== 'string') return;

        this.config.categories = this.config.categories.filter(
          c => c.id !== payload.categoryId
        );
        this.config.screens = this.sanitizeScreens(this.config.screens, this.config.categories);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_add': {
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!this.isValidProductAdd(payload)) return;

        const targetCat = this.config.categories.find(c => c.id === payload.categoryId);
        if (!targetCat) return;

        const product = {
          id: `prod-${crypto.randomUUID()}`,
          name: this.sanitizeString(payload.product.name),
          price: this.sanitizePrice(payload.product.price),
          originalPrice: typeof payload.product.originalPrice === 'number' ? this.sanitizePrice(payload.product.originalPrice) : undefined,
          thc: typeof payload.product.thc === 'string' ? this.sanitizeString(payload.product.thc) : undefined,
          cbd: typeof payload.product.cbd === 'string' ? this.sanitizeString(payload.product.cbd) : undefined,
          description: typeof payload.product.description === 'string' ? this.sanitizeString(payload.product.description) : undefined,
          image: typeof payload.product.image === 'string' ? this.sanitizeString(payload.product.image) : undefined,
          weight: typeof payload.product.weight === 'string' ? this.sanitizeString(payload.product.weight) : undefined,
          brand: typeof payload.product.brand === 'string' ? this.sanitizeString(payload.product.brand) : undefined,
          sku: typeof payload.product.sku === 'string' ? this.sanitizeString(payload.product.sku) : undefined,
          inStock: payload.product.inStock !== false,
          strain: this.sanitizeStrain(payload.product.strain),
          isPromo: Boolean(payload.product.isPromo),
          specialLabel: typeof payload.product.specialLabel === 'string' ? this.sanitizeString(payload.product.specialLabel) : undefined,
          priceTiers: this.sanitizePriceTiers(payload.product.priceTiers)
        };

        targetCat.products.push(product);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_update': {
        if (!(await this.requireModifyPermission(conn, server))) return;
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
          prod.originalPrice = typeof updates.originalPrice === 'number' ? this.sanitizePrice(updates.originalPrice) : undefined;
        }
        if (updates.thc !== undefined) {
          prod.thc = typeof updates.thc === 'string' ? this.sanitizeString(updates.thc) : undefined;
        }
        if (updates.cbd !== undefined) {
          prod.cbd = typeof updates.cbd === 'string' ? this.sanitizeString(updates.cbd) : undefined;
        }
        if (updates.description !== undefined) {
          prod.description = typeof updates.description === 'string' ? this.sanitizeString(updates.description) : undefined;
        }
        if (updates.image !== undefined) {
          prod.image = typeof updates.image === 'string' ? this.sanitizeString(updates.image) : undefined;
        }
        if (updates.weight !== undefined) {
          prod.weight = typeof updates.weight === 'string' ? this.sanitizeString(updates.weight) : undefined;
        }
        if (updates.brand !== undefined) {
          prod.brand = typeof updates.brand === 'string' ? this.sanitizeString(updates.brand) : undefined;
        }
        if (updates.sku !== undefined) {
          prod.sku = typeof updates.sku === 'string' ? this.sanitizeString(updates.sku) : undefined;
        }
        if (updates.inStock !== undefined) {
          prod.inStock = Boolean(updates.inStock);
        }
        if (updates.strain !== undefined) {
          prod.strain = this.sanitizeStrain(updates.strain);
        }
        if (updates.isPromo !== undefined) {
          prod.isPromo = Boolean(updates.isPromo);
        }
        if (updates.specialLabel !== undefined) {
          prod.specialLabel = typeof updates.specialLabel === 'string' ? this.sanitizeString(updates.specialLabel) : undefined;
        }
        if (updates.priceTiers !== undefined) {
          prod.priceTiers = this.sanitizePriceTiers(updates.priceTiers);
        }

        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_remove': {
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!isRecord(payload) ||
            typeof payload.categoryId !== 'string' || typeof payload.productId !== 'string') return;

        const rc = this.config.categories.find(c => c.id === payload.categoryId);
        if (!rc) return;

        rc.products = rc.products.filter(p => p.id !== payload.productId);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'product_toggle_stock': {
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!isRecord(payload) ||
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

      case 'product_move': {
        if (!(await this.requireModifyPermission(conn, server))) return;
        const payload = msg.payload;
        if (!isRecord(payload) ||
            typeof payload.fromCategoryId !== 'string' ||
            typeof payload.toCategoryId !== 'string' ||
            typeof payload.productId !== 'string') return;

        const fromCat = this.config.categories.find(c => c.id === payload.fromCategoryId);
        const toCat = this.config.categories.find(c => c.id === payload.toCategoryId);
        if (!fromCat || !toCat || fromCat.id === toCat.id) return;

        const idx = fromCat.products.findIndex(p => p.id === payload.productId);
        if (idx === -1) return;

        const [movedProduct] = fromCat.products.splice(idx, 1);
        toCat.products.push(movedProduct);
        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }

      case 'reorder': {
        if (!(await this.requireModifyPermission(conn, server))) return;
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
            .map((id) => byId.get(id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));
          cat.products = reordered;
        }

        await this.persistConfig();
        this.broadcast({ type: 'config', payload: this.config });
        break;
      }
    }
  }

  private isValidConfigUpdate(payload: unknown): payload is Partial<MenuConfig> {
    if (!isRecord(payload)) return false;

    const allowedKeys = ['dispensaryName', 'logo', 'primaryColor', 'secondaryColor',
                         'showStrain', 'showLogo', 'showDescription', 'showImages',
                         'showBrand', 'showPromos', 'currency', 'customFont', 'layout',
                         'layoutMode', 'fontSize', 'fontScale', 'theme', 'autoScroll', 'smoothProductScroll', 'pageDurationSeconds', 'smoothScrollSpeed', 'pageTransition', 'showCategory',
                         'promoBanner', 'scheduledBanners', 'specials', 'ageVerified', 'disclaimer', 'complianceState', 'analyticsEnabled', 'template',
                         'displayCount', 'screens', 'styleProfile'];

    for (const key of Object.keys(payload)) {
      if (!allowedKeys.includes(key)) return false;
    }

    if (payload.dispensaryName !== undefined && typeof payload.dispensaryName !== 'string') return false;
    if (payload.logo !== undefined && typeof payload.logo !== 'string') return false;
    if (payload.primaryColor !== undefined && (typeof payload.primaryColor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(payload.primaryColor))) return false;
    if (payload.secondaryColor !== undefined && (typeof payload.secondaryColor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(payload.secondaryColor))) return false;
    if (payload.currency !== undefined && typeof payload.currency !== 'string') return false;
    if (payload.customFont !== undefined && typeof payload.customFont !== 'string') return false;
    if (payload.layout !== undefined && this.sanitizeLayout(payload.layout) === undefined) return false;
    if (payload.fontSize !== undefined && this.sanitizeFontSize(payload.fontSize) === undefined) return false;
    if (payload.fontScale !== undefined && this.sanitizeFontScale(payload.fontScale) === undefined) return false;
    if (payload.theme !== undefined && this.sanitizeTheme(payload.theme) === undefined) return false;
    if (payload.template !== undefined && this.sanitizeTemplate(payload.template) === undefined) return false;
    if (payload.layoutMode !== undefined && this.sanitizeLayoutMode(payload.layoutMode) === undefined) return false;
    if (payload.displayCount !== undefined && this.sanitizeDisplayCount(payload.displayCount) === undefined) return false;
    if (payload.pageDurationSeconds !== undefined && this.sanitizePageDurationSeconds(payload.pageDurationSeconds) === undefined) return false;
    if (payload.smoothScrollSpeed !== undefined && this.sanitizeScrollSpeed(payload.smoothScrollSpeed) === undefined) return false;
    if (payload.pageTransition !== undefined && this.sanitizePageTransition(payload.pageTransition) === undefined) return false;
    if (payload.screens !== undefined && !Array.isArray(payload.screens)) return false;
    for (const key of ['showStrain', 'showLogo', 'showDescription', 'showImages', 'showBrand', 'showPromos', 'autoScroll', 'smoothProductScroll', 'ageVerified', 'analyticsEnabled'] as const) {
      if (payload[key] !== undefined && typeof payload[key] !== 'boolean') return false;
    }
    if (payload.showCategory !== undefined && payload.showCategory !== null && typeof payload.showCategory !== 'string') return false;
    if (payload.promoBanner !== undefined && !isRecord(payload.promoBanner)) return false;
    if (payload.specials !== undefined && !Array.isArray(payload.specials)) return false;
    if (payload.disclaimer !== undefined && typeof payload.disclaimer !== 'string') return false;
    if (payload.complianceState !== undefined && payload.complianceState !== '' && this.sanitizeComplianceState(payload.complianceState) === undefined) return false;
    if (payload.styleProfile !== undefined && payload.styleProfile !== null && !this.sanitizeStyleProfile(payload.styleProfile)) return false;

    return true;
  }

  private isValidCategoryAdd(payload: unknown): payload is CategoryAddPayload {
    return isRecord(payload) &&
           typeof payload.name === 'string' && payload.name.trim().length > 0 &&
           payload.name.trim().length <= 100 &&
           (payload.order === undefined || typeof payload.order === 'number');
  }

  private isValidCategoryUpdate(payload: unknown): payload is CategoryUpdatePayload {
    return isRecord(payload) &&
           typeof payload.categoryId === 'string' &&
           isRecord(payload.updates) &&
           (payload.updates.name === undefined ||
            (typeof payload.updates.name === 'string' && payload.updates.name.trim().length <= 100)) &&
           (payload.updates.order === undefined || typeof payload.updates.order === 'number');
  }

  private isValidProductAdd(payload: unknown): payload is ProductAddPayload {
    return isRecord(payload) &&
           typeof payload.categoryId === 'string' &&
           isRecord(payload.product) &&
           typeof payload.product.name === 'string' && payload.product.name.trim().length > 0 &&
           payload.product.name.trim().length <= 100 &&
           typeof payload.product.price === 'number' && !Number.isNaN(payload.product.price) &&
           payload.product.price >= 0 && payload.product.price <= 1000000;
  }

  private isValidProductUpdate(payload: unknown): payload is ProductUpdatePayload {
    return isRecord(payload) &&
           typeof payload.categoryId === 'string' &&
           typeof payload.productId === 'string' &&
           isRecord(payload.updates);
  }

  private isValidReorder(payload: unknown): payload is ReorderPayload {
    if (!isRecord(payload)) return false;
    if (payload.type !== 'categories' && payload.type !== 'products') return false;
    if (payload.type === 'products' && typeof payload.categoryId !== 'string') return false;
    if (!Array.isArray(payload.ids)) return false;
    if (!payload.ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 120)) return false;
    const seen = new Set<string>();
    for (const id of payload.ids) {
      if (seen.has(id)) return false;
      seen.add(id);
    }

    if (payload.type === 'categories') {
      const existing = new Set(this.config.categories.map(c => c.id));
      if (payload.ids.length !== existing.size) return false;
      if (!payload.ids.every((id) => existing.has(id))) return false;
      return true;
    }

    const cat = this.config.categories.find(c => c.id === payload.categoryId);
    if (!cat) return false;
    const existingProducts = new Set(cat.products.map(p => p.id));
    if (payload.ids.length !== existingProducts.size) return false;
    if (!payload.ids.every((id) => existingProducts.has(id))) return false;
    return true;
  }

  private isValidImportedCategories(categories: unknown): categories is unknown[] {
    if (!Array.isArray(categories) || categories.length > 20) return false;
    return categories.every((cat) => {
      if (!isRecord(cat) || typeof cat.name !== 'string' || cat.name.trim().length === 0 || !Array.isArray(cat.products) || cat.products.length > 500) return false;
      return cat.products.every((product) => isRecord(product) && typeof product.name === 'string' && typeof product.price === 'number');
    });
  }

  private sanitizeCategories(categories: unknown[]): Category[] {
    return categories.slice(0, 20).filter(isRecord).map((cat, index) => {
      const rawProducts = Array.isArray(cat.products) ? cat.products : [];
      return {
        id: typeof cat.id === 'string' ? this.sanitizeString(cat.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) : `cat-${index}`,
        name: typeof cat.name === 'string' ? this.sanitizeString(cat.name) : `Category ${index + 1}`,
        order: typeof cat.order === 'number' ? Math.max(0, Math.floor(cat.order)) : index,
        products: rawProducts.slice(0, 500).filter(isRecord).map((p, pIndex): Product => {
          const price = typeof p.price === 'number' ? this.sanitizePrice(p.price) : 0;
          const originalPrice = typeof p.originalPrice === 'number'
            ? this.sanitizePrice(p.originalPrice)
            : undefined;
          const specialLabel = typeof p.specialLabel === 'string'
            ? this.sanitizeString(p.specialLabel)
            : undefined;
          return {
            id: typeof p.id === 'string' ? this.sanitizeString(p.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) : `prod-${index}-${pIndex}`,
            name: typeof p.name === 'string' ? this.sanitizeString(p.name) : `Product ${pIndex + 1}`,
            price,
            originalPrice,
            thc: typeof p.thc === 'string' ? this.sanitizeString(p.thc) : undefined,
            cbd: typeof p.cbd === 'string' ? this.sanitizeString(p.cbd) : undefined,
            description: typeof p.description === 'string' ? this.sanitizeString(p.description) : undefined,
            image: typeof p.image === 'string' ? this.sanitizeString(p.image) : undefined,
            weight: typeof p.weight === 'string' ? this.sanitizeString(p.weight) : undefined,
            brand: typeof p.brand === 'string' ? this.sanitizeString(p.brand) : undefined,
            sku: typeof p.sku === 'string' ? this.sanitizeString(p.sku) : undefined,
            inStock: p.inStock !== false,
            strain: this.sanitizeStrain(p.strain),
            isPromo: Boolean(
              p.isPromo ||
              p.special ||
              specialLabel ||
              (originalPrice !== undefined && originalPrice > price)
            ),
            specialLabel,
            priceTiers: this.sanitizePriceTiers(p.priceTiers),
          };
        }),
      };
    }).sort((a, b) => a.order - b.order);
  }

  private sanitizeSpecials(specials: unknown): MenuSpecial[] {
    if (!Array.isArray(specials)) return [];
    return specials.slice(0, 12).filter(isRecord).map((special, index): MenuSpecial => ({
      id: typeof special.id === 'string' ? this.sanitizeString(special.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) : `special-${index}`,
      title: typeof special.title === 'string' ? this.sanitizeString(special.title) : '',
      description: typeof special.description === 'string' ? this.sanitizeString(special.description) : '',
      brand: typeof special.brand === 'string' ? this.sanitizeString(special.brand) : undefined,
      image: typeof special.image === 'string' ? this.sanitizeString(special.image) : undefined,
      price: typeof special.price === 'number' ? this.sanitizePrice(special.price) : undefined,
      originalPrice: typeof special.originalPrice === 'number' ? this.sanitizePrice(special.originalPrice) : undefined,
      priceTiers: this.sanitizePriceTiers(special.priceTiers),
      specialLabel: typeof special.specialLabel === 'string' ? this.sanitizeString(special.specialLabel) : undefined,
      active: special.active !== false,
    }));
  }

  private sanitizeStyleProfile(profile: unknown): ReferenceStyleProfile | undefined {
    if (!isRecord(profile)) return undefined;
    const intent = profile.intent === 'dense-menu-board' || profile.intent === 'image-led' || profile.intent === 'promo-board' || profile.intent === 'single-hero' || profile.intent === 'editorial-board'
      ? profile.intent
      : undefined;
    const layout = this.sanitizeLayout(profile.layout);
    const template = this.sanitizeTemplate(profile.template);
    const fontSize = this.sanitizeFontSize(profile.fontSize);
    if (!intent || !layout || !template || !fontSize) return undefined;
    const keywords = Array.isArray(profile.keywords)
      ? profile.keywords.filter((keyword): keyword is string => typeof keyword === 'string').slice(0, 12).map((keyword) => this.sanitizeString(keyword).slice(0, 40)).filter(Boolean)
      : [];
    const confidence = typeof profile.confidence === 'number' && Number.isFinite(profile.confidence)
      ? Math.max(0, Math.min(1, Math.round(profile.confidence * 100) / 100))
      : 0.5;
    return {
      sourceUrl: typeof profile.sourceUrl === 'string' ? this.sanitizeString(profile.sourceUrl).slice(0, 300) : undefined,
      notes: typeof profile.notes === 'string' ? this.sanitizeString(profile.notes).slice(0, 500) : undefined,
      intent,
      layout,
      template,
      fontSize,
      showImages: profile.showImages !== false,
      showDescription: profile.showDescription === true,
      showPromos: profile.showPromos !== false,
      showBrand: profile.showBrand !== false,
      showStrain: profile.showStrain !== false,
      confidence,
      keywords,
      summary: typeof profile.summary === 'string' ? this.sanitizeString(profile.summary).slice(0, 240) : 'Imported reference style',
      appliedAt: typeof profile.appliedAt === 'string' ? this.sanitizeString(profile.appliedAt).slice(0, 40) : new Date().toISOString(),
    };
  }

  private sanitizeString(str: string): string {
    return str.trim().slice(0, 500);
  }

  private sanitizePrice(price: number): number {
    return Math.max(0, Math.min(1000000, Math.round(price * 100) / 100));
  }

  private sanitizePriceTiers(tiers: unknown): PriceTier[] | undefined {
    if (!Array.isArray(tiers)) return undefined;
    const out: PriceTier[] = [];
    for (const t of tiers) {
      if (!isRecord(t)) continue;
      const label = typeof t.label === 'string' ? t.label.trim().slice(0, 20) : '';
      const price = typeof t.price === 'string' ? t.price.trim().slice(0, 20) : '';
      if (!label || !price) continue;
      out.push({ label, price });
      if (out.length >= 6) break;
    }
    return out.length > 0 ? out : undefined;
  }

  private sanitizeComplianceState(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const v = value.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(v) ? v : undefined;
  }

  private sanitizeStrain(value: unknown): Product['strain'] {
    return value === 'indica' || value === 'sativa' || value === 'hybrid' ? value : undefined;
  }

  private sanitizePageDurationSeconds(value: unknown): MenuConfig['pageDurationSeconds'] | undefined {
    return TV_PAGE_DURATION_OPTIONS.includes(value as MenuConfig['pageDurationSeconds'])
      ? value as MenuConfig['pageDurationSeconds']
      : undefined;
  }

  private sanitizeScrollSpeed(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    if (value < TV_SCROLL_SPEED_MIN || value > TV_SCROLL_SPEED_MAX) return undefined;
    return normalizeTvScrollSpeed(value);
  }

  private sanitizePageTransition(value: unknown): MenuConfig['pageTransition'] | undefined {
    return TV_PAGE_TRANSITIONS.includes(value as MenuConfig['pageTransition'])
      ? value as MenuConfig['pageTransition']
      : undefined;
  }

  private sanitizeLayout(value: unknown): MenuConfig['layout'] | undefined {
    if (value === 'auto' || value === 'grid' || value === 'list' || value === 'pricewall' || value === 'cards' || value === 'compact' || value === 'poster' || value === 'cinematic' || value === 'showcase' || value === 'editorial' || value === 'sparse') return value;
    return undefined;
  }

  private sanitizeLayoutMode(value: unknown): MenuConfig['layoutMode'] | undefined {
    if (value === 'auto' || value === 'columns' || value === 'pricelist' || value === 'compact' || value === 'grid') return value;
    return undefined;
  }

  private sanitizeFontSize(value: unknown): MenuConfig['fontSize'] | undefined {
    if (value === 'small' || value === 'medium' || value === 'large') return value;
    return undefined;
  }

  private sanitizeFontScale(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    const rounded = Math.round(value / 5) * 5;
    if (rounded < TV_FONT_SCALE_MIN || rounded > TV_FONT_SCALE_MAX) return undefined;
    return rounded;
  }

  private normalizeImportedFontScale(value: unknown, legacyFontSize: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return normalizeTvFontScale(value, legacyFontSize);
  }

  private fontScaleForFontSize(value: unknown): number | undefined {
    switch (this.sanitizeFontSize(value)) {
      case 'small':
        return TV_FONT_SCALE_MIN;
      case 'medium':
        return 100;
      case 'large':
        return 120;
      default:
        return undefined;
    }
  }

  private sanitizeHexColor(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const v = value.trim();
    return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : undefined;
  }

  private sanitizeTemplate(value: unknown): MenuConfig['template'] | undefined {
    if (value === 'default' || value === 'minimal' || value === 'neon' || value === 'light' || value === 'sunset' || value === 'forest' || value === 'royal' || value === 'gold' || value === 'ocean' || value === 'crimson' || value === 'bone' || value === 'vapor') return value;
    return undefined;
  }

  private sanitizeTheme(value: unknown): MenuConfig['theme'] | undefined {
    if (value === 'dark' || value === 'light') return value;
    return undefined;
  }

  private sanitizeScreens(value: unknown, categories: readonly Category[]): ScreenConfig[] {
    const requested = Array.isArray(value) ? value : [];
    const validCategoryIds = new Set(categories.map((category) => category.id));
    return DEFAULT_CONFIG.screens.map((defaultScreen, index) => {
      const requestedScreen = requested.find(
        (candidate) => isRecord(candidate) && candidate.id === defaultScreen.id
      );
      const raw = isRecord(requestedScreen) ? requestedScreen : {};
      const categoryIds = Array.isArray(raw.categoryIds)
        ? [...new Set(raw.categoryIds.filter((categoryId): categoryId is string =>
            typeof categoryId === 'string' && validCategoryIds.has(categoryId)
          ))].slice(0, 20)
        : [];
      const name = typeof raw.name === 'string' && raw.name.trim()
        ? this.sanitizeString(raw.name).slice(0, 60)
        : defaultScreen.name;
      const layout = this.sanitizeLayout(raw.layout);
      return {
        id: defaultScreen.id || `screen-${index + 1}`,
        name,
        categoryIds,
        ...(layout && layout !== 'auto' ? { layout } : {}),
      };
    });
  }

  private getActivePhysicalDisplays(): Set<number> {
    const displays = new Set<number>();
    for (const connection of this.connections.values()) {
      if (
        connection.role === 'tv'
        && !connection.isEmbed
        && typeof connection.displayNumber === 'number'
        && connection.displayNumber >= 1
        && connection.displayNumber <= 4
      ) {
        displays.add(connection.displayNumber);
      }
    }
    return displays;
  }

  private getWaitingPhysicalTvs(): WSConnection[] {
    return Array.from(this.connections.values()).filter((connection) =>
      connection.role === 'tv' && !connection.isEmbed
    );
  }

  private pruneDisplayPairingTargets(now = Date.now()): void {
    for (const [token, target] of this.displayPairingTargets) {
      if (target.expiresAt <= now || !this.connections.has(target.connectionId)) {
        this.displayPairingTargets.delete(token);
      }
    }
  }

  private async loadDisplayReservations(): Promise<DisplayReservation[]> {
    const stored = await this.state.storage.get<unknown>(DISPLAY_RESERVATIONS_STORAGE_KEY);
    const now = Date.now();
    const reservations = Array.isArray(stored)
      ? stored.filter((reservation): reservation is DisplayReservation =>
          isRecord(reservation)
          && typeof reservation.id === 'string'
          && typeof reservation.displayNumber === 'number'
          && Number.isInteger(reservation.displayNumber)
          && reservation.displayNumber >= 1
          && reservation.displayNumber <= 4
          && typeof reservation.expiresAt === 'number'
          && reservation.expiresAt > now
        )
      : [];
    return reservations;
  }

  private async saveDisplayReservations(reservations: DisplayReservation[]): Promise<void> {
    if (reservations.length > 0) {
      await this.state.storage.put(DISPLAY_RESERVATIONS_STORAGE_KEY, reservations);
    } else {
      await this.state.storage.delete(DISPLAY_RESERVATIONS_STORAGE_KEY);
    }
  }


  private sanitizeDisplayCount(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4 ? value : undefined;
  }

  private async requireModifyPermission(conn: WSConnection, server: WebSocket): Promise<boolean> {
    if (await this.canModifyConfig(conn)) return true;
    server.send(JSON.stringify({ type: 'error', payload: 'Unable to update config. Check ownership and subscription status.' }));
    return false;
  }

  private async getAuthorizedBusinessOwner(accountId: string): Promise<Account | null> {
    // Direct Durable Object unit tests do not provide the Worker-level ACCOUNTS
    // binding. Production always does, so retain the original single-owner
    // behavior only for that isolated storage test harness.
    if (!this.env.ACCOUNTS) {
      return {
        id: accountId,
        email: 'internal-test@dubmenu.invalid',
        createdAt: 0,
        updatedAt: 0,
        subscriptionStatus: 'active',
        sessions: [],
        businessId: accountId,
      };
    }
    const account = await getAccount(this.env, accountId);
    if (!account) return null;
    const businessOwner = await resolveBusinessAccount(this.env, account);
    if (!businessOwner) return null;
    if (businessOwner.id === account.id) return businessOwner;
    const isAcceptedMember = (businessOwner.businessMembers || []).some((member) =>
      member.accountId === account.id && member.role === 'manager'
    );
    return isAcceptedMember ? businessOwner : null;
  }

  private async canModifyConfig(conn: WSConnection): Promise<boolean> {
    if (conn.role !== 'phone') return false;
    if (!conn.accountId) return false;
    // A session is claimed to the business owner account. Accepted managers
    // resolve to that same owner and may edit the shared menu; billing remains
    // attached to the owner.
    if (!this.ownerAccountId) return false;
    const businessOwner = await this.getAuthorizedBusinessOwner(conn.accountId);
    if (!businessOwner || this.ownerAccountId !== businessOwner.id) return false;
    return isSubscriptionActive(businessOwner);
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
