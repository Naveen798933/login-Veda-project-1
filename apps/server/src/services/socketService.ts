import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClients, isRedisConnected } from '../config/redis';
// import Document from '../models/Document';
// import Version from '../models/Version';

// We'll use a modified approach inspired by y-websocket but for Socket.io
// To simplify, we'll track docs in memory or Redis (for Week 3)
// const pubs = new Map<string, Y.Doc>();

export const initSocketService = async (io: Server) => {
  try {
    const { pubClient, subClient } = getRedisClients();

    if (isRedisConnected() && pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✓ Socket.io Redis adapter initialized');
    } else {
      console.log('ℹ Socket.io running in local mode (no horizontal scaling)');
    }
  } catch (err: unknown) {
    console.warn('⚠️ Socket.io adapter setup failed:', err instanceof Error ? err.message : '');
  }

  const docs = new Map<string, Y.Doc>();
  
  io.on('connection', (socket: Socket) => {
    const { docId, userName } = socket.handshake.query as { docId?: string, userName?: string };
    const { userId: _userId, userColor: _userColor } = socket.handshake.query as { userId?: string, userColor?: string };


    if (!docId) return socket.disconnect();

    console.log(`User ${userName} joined document ${docId}`);

    // Join room for the specific document
    socket.join(docId);

    // Get or create Yjs doc
    let doc = docs.get(docId);
    if (!doc) {
      doc = new Y.Doc();
      docs.set(docId, doc);
    }

    // Handle Yjs sync message
    socket.on('sync-update', (update: Uint8Array) => {
      Y.applyUpdate(doc!, new Uint8Array(update), 'socket');
      socket.to(docId).emit('sync-update', update);
    });

    // Handle Awareness (Cursors/Presence)
    socket.on('awareness-update', (update: Uint8Array) => {
      socket.to(docId).emit('awareness-update', update);
    });

    // Handle Document Load (Initial state)
    const stateVector = Y.encodeStateVector(doc);
    socket.emit('sync-step-1', stateVector);

    socket.on('sync-step-2', (stateVector: Uint8Array) => {
      const update = Y.encodeStateAsUpdate(doc!, new Uint8Array(stateVector));
      socket.emit('sync-update', update);
    });

    socket.on('disconnect', () => {
      console.log(`User ${userName} left document ${docId}`);
      // Clean up doc if no one is left (Optional for memory management)
      const room = io.sockets.adapter.rooms.get(docId);
      if (!room || room.size === 0) {
        // We could persist to DB here then delete from memory
        // docs.delete(docId);
      }
    });

    // Heartbeat for presence
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
};
