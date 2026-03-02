import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { filesRoutes } from './routes/files.js';
import { storageService } from './services/storage.js';

const fastify = Fastify({
  logger: {
    level: config.isDev ? 'info' : 'warn',
  },
});

await fastify.register(cors, {
  origin: config.frontendUrl,
  credentials: true,
});

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024,
  },
});

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(filesRoutes, { prefix: '/api/files' });

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await storageService.initialize();
    
    await fastify.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    });
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
