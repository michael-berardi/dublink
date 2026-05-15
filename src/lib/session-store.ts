import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Session, MenuConfig, DEFAULT_CONFIG, ServerToClientEvents, ClientToServerEvents } from './types';

const sessions = new Map<string, Session>();
const ioInstances = new Map<string, SocketIOServer<ClientToServerEvents, ServerToClientEvents>>();

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function createSession(): Session {
  const session: Session = {
    id: uuidv4(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    config: { ...DEFAULT_CONFIG },
    tvConnected: false,
    phoneConnected: false,
  };
  sessions.set(session.id, session);
  return session;
}

export function updateSessionConfig(sessionId: string, updates: Partial<MenuConfig>): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.config = { ...session.config, ...updates };
  session.lastActivity = Date.now();
  return true;
}

export function cleanupSessions(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      sessions.delete(id);
    }
  }
}

export function getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined {
  return ioInstances.get('default');
}

export function setIO(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>): void {
  ioInstances.set('default', io);
}

// Cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);
