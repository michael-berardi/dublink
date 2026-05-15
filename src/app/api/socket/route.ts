import { createServer } from 'http';
import { NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@/lib/types';
import { getSession, createSession, updateSessionConfig, setIO } from '@/lib/session-store';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export async function GET() {
  if (!io) {
    const httpServer = createServer();
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('session:join', (sessionId, role) => {
        let session = getSession(sessionId);
        if (!session) {
          session = createSession();
          session.id = sessionId;
        }

        socket.join(sessionId);

        if (role === 'tv') {
          session.tvConnected = true;
        } else {
          session.phoneConnected = true;
        }

        socket.emit('session:connected', role);
        socket.to(sessionId).emit('session:connected', role);

        // Send current config to the newly connected client
        socket.emit('session:update', session.config);

        // Notify TV if phone connects (or vice versa)
        if (session.tvConnected && session.phoneConnected) {
          io.to(sessionId).emit('session:paired');
        }

        socket.on('disconnect', () => {
          if (role === 'tv') {
            session!.tvConnected = false;
          } else {
            session!.phoneConnected = false;
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
        if (!session) return;
        const newCategory = { ...category, id: `cat-${Date.now()}` };
        session.config.categories.push(newCategory);
        session.config.categories.sort((a, b) => a.order - b.order);
        io.to(sessionId).emit('session:update', session.config);
      });

      socket.on('category:update', (sessionId, categoryId, updates) => {
        const session = getSession(sessionId);
        if (!session) return;
        const cat = session.config.categories.find(c => c.id === categoryId);
        if (cat) {
          Object.assign(cat, updates);
          io.to(sessionId).emit('session:update', session.config);
        }
      });

      socket.on('category:remove', (sessionId, categoryId) => {
        const session = getSession(sessionId);
        if (!session) return;
        session.config.categories = session.config.categories.filter(c => c.id !== categoryId);
        io.to(sessionId).emit('session:update', session.config);
      });

      socket.on('product:add', (sessionId, categoryId, product) => {
        const session = getSession(sessionId);
        if (!session) return;
        const cat = session.config.categories.find(c => c.id === categoryId);
        if (cat) {
          cat.products.push({ ...product, id: `prod-${Date.now()}` });
          io.to(sessionId).emit('session:update', session.config);
        }
      });

      socket.on('product:update', (sessionId, categoryId, productId, updates) => {
        const session = getSession(sessionId);
        if (!session) return;
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
        if (!session) return;
        const cat = session.config.categories.find(c => c.id === categoryId);
        if (cat) {
          cat.products = cat.products.filter(p => p.id !== productId);
          io.to(sessionId).emit('session:update', session.config);
        }
      });

      socket.on('product:toggle-stock', (sessionId, categoryId, productId) => {
        const session = getSession(sessionId);
        if (!session) return;
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

    setIO(io);
    httpServer.listen(3001);
  }

  return NextResponse.json({ success: true });
}
