import { FastifyPluginAsync } from 'fastify';
import { pipeline } from 'stream/promises';
import { randomUUID, createHash } from 'crypto';
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

  fastify.get('/check', async (request, reply) => {
    const { checksum } = request.query as { checksum?: string };
    
    if (!checksum) {
      return reply.code(400).send({ error: 'Checksum required' });
    }

    const result = await pool.query(
      'SELECT id, name, checksum FROM files WHERE checksum = $1 AND "userId" = $2',
      [checksum, 'frank']
    );

    return reply.send({ 
      exists: result.rows.length > 0,
      file: result.rows[0] || null
    });
  });

  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    const fileBuffer = await data.toBuffer();
    const fileSize = fileBuffer.length;
    
    const checksum = createHash('sha256').update(fileBuffer).digest('hex');

    const existingFile = await pool.query(
      'SELECT * FROM files WHERE checksum = $1 AND "userId" = $2',
      [checksum, 'frank']
    );

    if (existingFile.rows.length > 0) {
      return reply.send({ 
        success: true,
        duplicate: true,
        message: 'File already exists',
        file: existingFile.rows[0]
      });
    }

    const fileId = randomUUID();
    const objectKey = `${fileId}-${data.filename}`;
    
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
      `INSERT INTO files (id, name, size, "mimeType", "objectKey", "userId", checksum, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING *`,
      [fileId, data.filename, fileSize, data.mimetype, objectKey, 'frank', checksum]
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

  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };
    
    if (!name) {
      return reply.code(400).send({ error: 'Name is required' });
    }

    const result = await pool.query(
      'UPDATE files SET name = $1, \"updatedAt\" = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'File not found' });
    }

    return reply.send({ file: result.rows[0] });
  });
};
