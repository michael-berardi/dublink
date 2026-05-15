const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Default menu configuration
const DEFAULT_CONFIG = {
  dispensaryName: 'DubHaven Dispensary',
  primaryColor: '#10b981',
  secondaryColor: '#065f46',
  showThcCbd: true,
  showStrain: true,
  showPrices: true,
  currency: '$',
  layout: 'grid',
  fontSize: 'medium',
  theme: 'dark',
  categories: [
    {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [
        { id: 'f1', name: 'OG Kush', price: 45, thc: '24%', cbd: '0.1%', strain: 'hybrid', inStock: true },
        { id: 'f2', name: 'Blue Dream', price: 42, thc: '21%', cbd: '0.2%', strain: 'sativa', inStock: true },
        { id: 'f3', name: 'Northern Lights', price: 40, thc: '19%', cbd: '0.1%', strain: 'indica', inStock: true },
        { id: 'f4', name: 'Gelato', price: 48, thc: '25%', cbd: '0.1%', strain: 'hybrid', inStock: false },
      ]
    },
    {
      id: 'edibles',
      name: 'Edibles',
      order: 1,
      products: [
        { id: 'e1', name: 'Gummy Bears 100mg', price: 25, thc: '100mg', cbd: '0mg', inStock: true },
        { id: 'e2', name: 'Chocolate Bar 200mg', price: 35, thc: '200mg', cbd: '0mg', inStock: true },
        { id: 'e3', name: 'CBD Gummies 50mg', price: 30, thc: '0mg', cbd: '50mg', inStock: true },
      ]
    },
    {
      id: 'concentrates',
      name: 'Concentrates',
      order: 2,
      products: [
        { id: 'c1', name: 'Live Resin', price: 65, thc: '82%', cbd: '0.2%', inStock: true },
        { id: 'c2', name: 'Shatter', price: 55, thc: '78%', cbd: '0.1%', inStock: true },
        { id: 'c3', name: 'Rosin', price: 75, thc: '85%', cbd: '0.3%', inStock: true },
      ]
    },
    {
      id: 'vapes',
      name: 'Vapes',
      order: 3,
      products: [
        { id: 'v1', name: 'Disposable Pen', price: 55, thc: '85%', cbd: '0.2%', inStock: true },
        { id: 'v2', name: 'Cartridge 1g', price: 60, thc: '88%', cbd: '0.1%', inStock: true },
        { id: 'v3', name: 'CBD Cartridge', price: 50, thc: '0%', cbd: '500mg', inStock: false },
      ]
    }
  ]
};

// In-memory session store
const sessions = new Map();

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function createSession(sessionId) {
  const session = {
    id: sessionId || uuidv4(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    tvConnected: false,
    phoneConnected: false,
  };
  sessions.set(session.id, session);
  return session;
}

function updateSessionConfig(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.config = { ...session.config, ...updates };
  session.lastActivity = Date.now();
  return true;
}

function cleanupSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      sessions.delete(id);
    }
  }
}

setInterval(cleanupSessions, 60 * 60 * 1000);

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('session:join', (sessionId, role) => {
      let session = getSession(sessionId);
      if (!session) {
        session = createSession(sessionId);
      }

      socket.join(sessionId);

      if (role === 'tv') {
        session.tvConnected = true;
      } else {
        session.phoneConnected = true;
      }

      socket.emit('session:connected', role);
      socket.to(sessionId).emit('session:connected', role);

      if (session.config) {
        socket.emit('session:update', session.config);
      }

      if (session.tvConnected && session.phoneConnected) {
        io.to(sessionId).emit('session:paired');
      }

      socket.on('disconnect', () => {
        if (role === 'tv') {
          session.tvConnected = false;
        } else {
          session.phoneConnected = false;
        }
        socket.to(sessionId).emit('session:disconnected', role);
      });
    });

    socket.on('config:update', (sessionId, config) => {
      const success = updateSessionConfig(sessionId, config);
      if (success) {
        const session = getSession(sessionId);
        if (session) {
          io.to(sessionId).emit('session:update', session.config);
        }
      }
    });

    socket.on('category:add', (sessionId, category) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      const newCategory = { ...category, id: `cat-${Date.now()}` };
      session.config.categories.push(newCategory);
      session.config.categories.sort((a, b) => a.order - b.order);
      io.to(sessionId).emit('session:update', session.config);
    });

    socket.on('category:update', (sessionId, categoryId, updates) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      const cat = session.config.categories.find(c => c.id === categoryId);
      if (cat) {
        Object.assign(cat, updates);
        io.to(sessionId).emit('session:update', session.config);
      }
    });

    socket.on('category:remove', (sessionId, categoryId) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      session.config.categories = session.config.categories.filter(c => c.id !== categoryId);
      io.to(sessionId).emit('session:update', session.config);
    });

    socket.on('product:add', (sessionId, categoryId, product) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      const cat = session.config.categories.find(c => c.id === categoryId);
      if (cat) {
        cat.products.push({ ...product, id: `prod-${Date.now()}` });
        io.to(sessionId).emit('session:update', session.config);
      }
    });

    socket.on('product:update', (sessionId, categoryId, productId, updates) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      const cat = session.config.categories.find(c => c.id === categoryId);
      if (cat) {
        const prod = cat.products.find(p => p.id === productId);
        if (prod) {
          Object.assign(prod, updates);
          io.to(sessionId).emit('session:update', session.config);
        }
      }
    });

    socket.on('product:remove', (sessionId, categoryId, productId) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      const cat = session.config.categories.find(c => c.id === categoryId);
      if (cat) {
        cat.products = cat.products.filter(p => p.id !== productId);
        io.to(sessionId).emit('session:update', session.config);
      }
    });

    socket.on('product:toggle-stock', (sessionId, categoryId, productId) => {
      const session = getSession(sessionId);
      if (!session || !session.config) return;
      const cat = session.config.categories.find(c => c.id === categoryId);
      if (cat) {
        const prod = cat.products.find(p => p.id === productId);
        if (prod) {
          prod.inStock = !prod.inStock;
          io.to(sessionId).emit('session:update', session.config);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Dublink ready on http://${hostname}:${port}`);
  });
});
