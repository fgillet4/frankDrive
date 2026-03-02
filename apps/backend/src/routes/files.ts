import { FastifyPluginAsync } from 'fastify';
import { pipeline } from 'stream/promises';
import { randomUUID, createHash } from 'crypto';
import { extname } from 'path';
import { storageService } from '../services/storage.js';
import pg from 'pg';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
  '.webm': 'video/webm', '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain', '.md': 'text/markdown',
  '.zip': 'application/zip', '.tar': 'application/x-tar', '.gz': 'application/gzip',
};

function resolveMime(filename: string, provided: string): string {
  if (provided && provided !== 'application/octet-stream' && provided !== 'text/plain') {
    return provided;
  }
  const ext = extname(filename).toLowerCase();
  return MIME_MAP[ext] || provided || 'application/octet-stream';
}

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
    const mimeType = resolveMime(data.filename, data.mimetype);

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

    await storageService.uploadFile(objectKey, fileBuffer, fileSize, {
      'content-type': mimeType,
      'original-filename': data.filename,
    });

    const result = await pool.query(
      `INSERT INTO files (id, name, size, "mimeType", "objectKey", "userId", checksum, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [fileId, data.filename, fileSize, mimeType, objectKey, 'frank', checksum]
    );
    return reply.send({ success: true, file: result.rows[0] });
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

    const file = result.rows[0];
    const stream = await storageService.getFile(file.objectKey);

    reply.header('Content-Type', file.mimeType);
    reply.header('Content-Disposition', `attachment; filename="${file.name}"`);
    return reply.send(stream);
  });

  fastify.get('/:id/preview', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'File not found' });
    }

    const file = result.rows[0];
    const stream = await storageService.getFile(file.objectKey);

    reply.header('Content-Type', file.mimeType);
    reply.header('Content-Disposition', `inline; filename="${file.name}"`);
    return reply.send(stream);
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
