import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URI || 'redis://localhost:6379';

let pubClient: IORedis | null = null;
let subClient: IORedis | null = null;
let isConnected = false;

export async function initializeRedis(): Promise<boolean> {
  try {
    if (isConnected) {
      console.log('✓ Redis already initialized');
      return true;
    }

    pubClient = new IORedis(REDIS_URL, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy(times) {
        return times > 1 ? null : 1000;
      },
    });

    pubClient.on('connect', () => {
      console.log('✓ Redis pub client connected');
    });

    pubClient.on('error', (err) => {
      console.error('⚠️ Redis pub client error:', err.message);
    });

    await pubClient.connect().catch((err) => {
      console.warn('⚠️ Failed to connect to Redis:', err.message);
      console.warn('    Running in local mode (no horizontal scaling)');
      return false;
    });

    if (pubClient.status === 'ready') {
      subClient = pubClient.duplicate();
      subClient.on('error', () => {
        // Silent error handler for sub client
      });

      isConnected = true;
      console.log('✓ Redis initialized successfully');
      return true;
    }

    return false;
  } catch (err) {
    console.warn('⚠️ Redis initialization failed:', err instanceof Error ? err.message : '');
    return false;
  }
}

export function getRedisClients(): { pubClient: IORedis | null; subClient: IORedis | null } {
  return { pubClient, subClient };
}

export function isRedisConnected(): boolean {
  return isConnected && pubClient?.status === 'ready';
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (pubClient) {
      await pubClient.quit();
      console.log('✓ Redis pub client disconnected');
    }
    if (subClient) {
      await subClient.quit();
      console.log('✓ Redis sub client disconnected');
    }
    isConnected = false;
  } catch (err) {
    console.error('Error disconnecting Redis:', err instanceof Error ? err.message : '');
  }
}
