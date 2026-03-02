import { FastifyPluginAsync } from 'fastify';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { storageService } from '../services/storage.js';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const filesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const result = await pool.query('SELECT * FROM files ORDER BY "createdAt" DESC LIMIT 100');
    return reply.send({ files: result.rows });
  });

  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    const fileId = randomUUID();
    const objectKey = `${fileId}-${data.filename}`;
    
    const fileBuffer = await data.toBuffer();
    const fileSize = fileBuffer.length;
    
    await storageService.uploadFile(
      objectKey,
      fileBuffer,
      fileSize,
      {
        'content-type': data.mimetype,
        'original-filename': data.filename,
      }
    );

    const result = await pool.query(
      `INSERT INTO files (id, name, size, "mimeType", "objectKey", "userId", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING *`,
      [fileId, data.filename, fileSize, data.mimetype, objectKey, 'demo-user']
    );

    return reply.send({ 
      success: true,
      file: result.rows[0]
    });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'File not found' });
    }

    return reply.send({ file: result.rows[0] });
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'File not found' });
    }

    await storageService.deleteFile(result.rows[0].objectKey);
    await pool.query('DELETE FROM files WHERE id = $1', [id]);

    return reply.send({ success: true });
  });

  fastify.get('/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'File not found' });
    }

    const url = await storageService.getFileUrl(result.rows[0].objectKey);
    return reply.redirect(url);
  });
};
