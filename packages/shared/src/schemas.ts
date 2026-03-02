import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
});

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  folderId: z.string().optional(),
});

export const shareSchema = z.object({
  fileId: z.string().optional(),
  folderId: z.string().optional(),
  sharedWithId: z.string(),
  permission: z.enum(['READ', 'WRITE', 'ADMIN']),
  expiresAt: z.string().datetime().optional(),
});
